-- Restrain Yourself Database Schema
-- This script sets up the complete database schema for the habit tracking application

-- Enable Row Level Security

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create habit_entries table
CREATE TABLE IF NOT EXISTS habit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(habit_id, date)
);

-- Create motivational_quotes table
CREATE TABLE IF NOT EXISTS motivational_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1
);

-- Create health_tips table
CREATE TABLE IF NOT EXISTS health_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_id ON habit_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(date);
CREATE INDEX IF NOT EXISTS idx_motivational_quotes_category ON motivational_quotes(category);
CREATE INDEX IF NOT EXISTS idx_motivational_quotes_is_active ON motivational_quotes(is_active);
CREATE INDEX IF NOT EXISTS idx_health_tips_category ON health_tips(category);
CREATE INDEX IF NOT EXISTS idx_health_tips_is_active ON health_tips(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_motivational_quotes_updated_at BEFORE UPDATE ON motivational_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_tips_updated_at BEFORE UPDATE ON health_tips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivational_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Simplified RLS Policies - Allow all operations for now
-- Security is handled at the application layer

-- Users policies - allow all operations
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (TRUE);

-- Habits policies - allow all operations
CREATE POLICY "Allow all operations on habits" ON habits
    FOR ALL USING (TRUE);

-- Habit entries policies - allow all operations
CREATE POLICY "Allow all operations on habit_entries" ON habit_entries
    FOR ALL USING (TRUE);

-- Content policies - allow all operations
CREATE POLICY "Allow all operations on quotes" ON motivational_quotes
    FOR ALL USING (TRUE);

CREATE POLICY "Allow all operations on health_tips" ON health_tips
    FOR ALL USING (TRUE);

-- Audit logs - allow all operations
CREATE POLICY "Allow all operations on audit_logs" ON audit_logs
    FOR ALL USING (TRUE);

-- Insert sample motivational quotes
INSERT INTO motivational_quotes (text, author, category, is_active) VALUES
('The first step towards getting somewhere is to decide you are not going to stay where you are.', 'J.P. Morgan', 'smoking', TRUE),
('Your limitation—it''s only your imagination.', 'Anonymous', 'smoking', TRUE),
('Great things never come from comfort zones.', 'Anonymous', 'drinking', TRUE),
('Don''t stop when you''re tired. Stop when you''re done.', 'Unknown', 'drinking', TRUE),
('Wake up with determination. Go to bed with satisfaction.', 'Unknown', 'social-media', TRUE),
('The key to success is to focus on goals, not obstacles.', 'Unknown', 'social-media', TRUE),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', 'junk-food', TRUE),
('The only way to do great work is to love what you do.', 'Steve Jobs', 'junk-food', TRUE),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', 'adult-content', TRUE),
('It does not matter how slowly you go as long as you do not stop.', 'Confucius', 'adult-content', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample health tips
INSERT INTO health_tips (title, content, category, is_active) VALUES
('Deep Breathing Exercise', 'When you feel the urge to smoke, try taking 10 deep breaths. This helps calm your nervous system and reduce cravings naturally.', 'smoking', TRUE),
('Stay Hydrated', 'Drinking plenty of water helps flush nicotine from your system faster and can reduce withdrawal symptoms.', 'smoking', TRUE),
('Healthy Alternatives', 'Replace alcoholic drinks with sparkling water, herbal teas, or fresh fruit juices to satisfy the habit without the alcohol.', 'drinking', TRUE),
('Exercise Boost', 'Physical activity releases endorphins that naturally improve your mood and reduce the desire for alcohol.', 'drinking', TRUE),
('Digital Detox Schedule', 'Set specific times for checking social media instead of mindless scrolling. Use app timers to enforce limits.', 'social-media', TRUE),
('Real-World Connections', 'Replace social media time with face-to-face interactions or phone calls with friends and family.', 'social-media', TRUE),
('Mindful Eating', 'Before reaching for junk food, ask yourself if you''re actually hungry or just bored, stressed, or emotional.', 'junk-food', TRUE),
('Healthy Snack Prep', 'Keep nutritious snacks like fruits, nuts, or yogurt easily accessible to avoid impulsive junk food choices.', 'junk-food', TRUE),
('Mental Health Benefits', 'Reducing consumption of adult content can improve self-esteem, relationship satisfaction, and overall mental well-being.', 'adult-content', TRUE),
('Find New Hobbies', 'Redirect your energy into creative pursuits, sports, reading, or learning new skills to fill the time productively.', 'adult-content', TRUE)
ON CONFLICT DO NOTHING;

-- Create a function to set the current user context
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
