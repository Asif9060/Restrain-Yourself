-- Notifications Database Schema
-- This script adds notification-related tables to support push notifications

-- Create user_devices table to store FCM tokens and device info
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
    device_name TEXT,
    platform_version TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table for user settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    reminder_time TIME DEFAULT '22:30:00', -- 10:30 PM default
    timezone TEXT DEFAULT 'UTC',
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- All days by default (1=Monday, 7=Sunday)
    reminder_buffer_hours INTEGER DEFAULT 2, -- Send reminder if no activity in last 2 hours
    sound_enabled BOOLEAN DEFAULT TRUE,
    vibration_enabled BOOLEAN DEFAULT TRUE,
    badge_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_logs table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('daily_reminder', 'habit_streak', 'motivational', 'achievement')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'clicked')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_batches table for batch processing
CREATE TABLE IF NOT EXISTS notification_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_notifications INTEGER DEFAULT 0,
    sent_notifications INTEGER DEFAULT 0,
    failed_notifications INTEGER DEFAULT 0,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_scheduled ON notification_logs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_batches_status ON notification_batches(status);
CREATE INDEX IF NOT EXISTS idx_notification_batches_scheduled ON notification_batches(scheduled_for);

-- Create triggers for updated_at
CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on notification tables
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can manage their own devices" ON user_devices
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage their own preferences" ON notification_preferences
    FOR ALL USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can view their own notification logs" ON notification_logs
    FOR SELECT USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Admins can view all notification batches" ON notification_batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = current_setting('app.current_user_id', true) 
            AND is_admin = true
        )
    );

-- Function to get users who need reminders
CREATE OR REPLACE FUNCTION get_users_needing_reminders(target_time TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    user_id TEXT,
    device_tokens TEXT[],
    timezone TEXT,
    unmarked_habits INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_timezones AS (
        SELECT 
            np.user_id,
            np.timezone,
            np.reminder_time,
            np.enabled,
            np.days_of_week
        FROM notification_preferences np
        WHERE np.enabled = true
        AND EXTRACT(ISODOW FROM target_time AT TIME ZONE np.timezone) = ANY(np.days_of_week)
    ),
    users_with_devices AS (
        SELECT 
            ut.user_id,
            ut.timezone,
            array_agg(ud.device_token) as tokens
        FROM user_timezones ut
        JOIN user_devices ud ON ut.user_id = ud.user_id
        WHERE ud.is_active = true
        AND (target_time AT TIME ZONE ut.timezone)::TIME 
            BETWEEN ut.reminder_time - INTERVAL '15 minutes' 
            AND ut.reminder_time + INTERVAL '15 minutes'
        GROUP BY ut.user_id, ut.timezone
    ),
    users_with_unmarked_habits AS (
        SELECT 
            uwd.user_id,
            uwd.tokens,
            uwd.timezone,
            COUNT(h.id) as unmarked_count
        FROM users_with_devices uwd
        JOIN habits h ON uwd.user_id = h.user_id
        LEFT JOIN habit_entries he ON h.id = he.habit_id 
            AND he.date = CURRENT_DATE
        WHERE h.is_active = true
        AND he.id IS NULL -- No entry for today
        GROUP BY uwd.user_id, uwd.tokens, uwd.timezone
        HAVING COUNT(h.id) > 0
    )
    SELECT 
        uwuh.user_id,
        uwuh.tokens,
        uwuh.timezone,
        uwuh.unmarked_count::INTEGER
    FROM users_with_unmarked_habits uwuh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log notification delivery status
CREATE OR REPLACE FUNCTION update_notification_status(
    notification_id UUID,
    new_status TEXT,
    error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE notification_logs 
    SET 
        status = new_status,
        error_message = error_msg,
        delivered_at = CASE WHEN new_status = 'delivered' THEN NOW() ELSE delivered_at END,
        clicked_at = CASE WHEN new_status = 'clicked' THEN NOW() ELSE clicked_at END
    WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;