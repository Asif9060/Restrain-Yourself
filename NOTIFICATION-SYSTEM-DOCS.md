# Push Notification System Documentation

## Overview

This document describes the implementation of a comprehensive mobile push notification system for the Restrain Yourself habit tracking application. The system supports cross-platform notifications (iOS, Android, Web) with timezone-aware delivery and user preference management.

## Architecture

### Components

1. **Firebase Cloud Messaging (FCM)** - Push notification delivery service
2. **Notification Service** - Core business logic for notification management
3. **Notification Scheduler** - Cron-based scheduling system
4. **Database Schema** - User devices, preferences, and notification logging
5. **API Endpoints** - RESTful APIs for notification management
6. **React Components** - User interface for notification settings
7. **Service Worker** - Background notification handling

### Key Features

-  ✅ Daily reminders at 10:30 PM local time
-  ✅ Cross-platform support (iOS, Android, Web)
-  ✅ Timezone handling for accurate delivery
-  ✅ User preference management
-  ✅ Delivery status tracking and analytics
-  ✅ Retry logic for failed deliveries
-  ✅ Device management and token validation
-  ✅ Deep linking to specific app sections

## Setup Instructions

### 1. Firebase Project Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Cloud Messaging in your project
3. Generate a VAPID key for web push notifications
4. Download the service account JSON file
5. Add your domain to authorized domains

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 3. Database Setup

Run the notification schema SQL file against your Supabase database:

```bash
psql -h your_supabase_host -U postgres -d postgres -f database/notifications-schema.sql
```

Or manually execute the SQL commands in your Supabase SQL editor.

### 4. Service Account Configuration

Place your Firebase service account JSON file at:

```
config/firebase-service-account.json
```

Alternatively, use environment variables as shown above.

## Usage

### 1. User Registration

When a user first visits the app, register their device for notifications:

```typescript
import { NotificationSettings } from "@/components/NotificationSettings";

// In your user dashboard or settings page
<NotificationSettings userId={user.id} />;
```

### 2. Sending Notifications

#### Manual Notification

```typescript
import { NotificationService } from "@/services/NotificationService";

await NotificationService.sendNotificationToUser(
   userId,
   "Reminder Title",
   "Don't forget to track your habits today!",
   "daily_reminder",
   { deep_link: "/dashboard" }
);
```

#### Test Notification

```typescript
import { NotificationScheduler } from "@/lib/notification-scheduler";

await NotificationScheduler.sendTestNotification(userId);
```

### 3. Scheduled Notifications

The system automatically sends daily reminders at 10:30 PM local time for each user. The scheduler runs every 15 minutes to catch users in different timezones.

### 4. Managing Preferences

Users can customize their notification preferences through the settings component:

-  Enable/disable notifications
-  Set custom reminder time
-  Choose specific days of the week
-  Configure notification style (sound, vibration, badge)
-  Select timezone

## API Endpoints

### Device Management

#### Register Device

```http
POST /api/notifications/devices
Content-Type: application/json

{
  "userId": "user_id",
  "deviceToken": "fcm_token",
  "deviceInfo": {
    "device_type": "web",
    "device_name": "Chrome Browser",
    "timezone": "America/New_York"
  }
}
```

#### Unregister Device

```http
DELETE /api/notifications/devices
Content-Type: application/json

{
  "deviceToken": "fcm_token"
}
```

### Preferences

#### Get Preferences

```http
GET /api/notifications/preferences?userId=user_id
```

#### Update Preferences

```http
PUT /api/notifications/preferences
Content-Type: application/json

{
  "userId": "user_id",
  "preferences": {
    "enabled": true,
    "reminder_time": "22:30:00",
    "timezone": "America/New_York",
    "days_of_week": [1,2,3,4,5,6,7]
  }
}
```

### Sending Notifications

#### Send Notification

```http
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user_id",
  "title": "Reminder Title",
  "body": "Don't forget your habits!",
  "type": "daily_reminder",
  "data": {
    "deep_link": "/dashboard"
  }
}
```

#### Test Notifications

```http
GET /api/notifications/send?userId=user_id&action=test
GET /api/notifications/send?userId=user_id&action=motivational
GET /api/notifications/send?userId=user_id&action=streak
```

### Analytics

#### Get Notification Statistics

```http
GET /api/notifications/stats?userId=user_id&days=7
```

Response:

```json
{
   "totalSent": 10,
   "totalDelivered": 9,
   "totalClicked": 3,
   "totalFailed": 1,
   "deliveryRate": 90.0,
   "clickRate": 33.3
}
```

## Database Schema

### Tables

#### user_devices

Stores device tokens and information for each user's devices.

#### notification_preferences

User-specific notification settings and preferences.

#### notification_logs

Detailed logs of all notification attempts with delivery status.

#### notification_batches

Tracks batch notification processing for analytics.

### Key Functions

#### get_users_needing_reminders()

Returns users who need daily reminders based on their timezone and preferences.

#### update_notification_status()

Updates the delivery status of a notification.

## Monitoring and Analytics

### Delivery Tracking

The system tracks:

-  Notification sent status
-  Delivery confirmation
-  User interactions (clicks)
-  Failed deliveries with error details

### Performance Metrics

Monitor these key metrics:

-  **Delivery Rate**: Percentage of notifications successfully delivered
-  **Click-through Rate**: Percentage of delivered notifications that were clicked
-  **Device Health**: Active vs inactive device tokens
-  **Timezone Distribution**: Users across different timezones

### Error Handling

Common error scenarios and handling:

1. **Invalid Token**: Automatically deactivate device
2. **Rate Limiting**: Implement exponential backoff
3. **Network Errors**: Retry with increasing delays
4. **Permission Denied**: Update user preferences

## Security Considerations

### Token Management

-  Device tokens are encrypted in transit
-  Regularly validate and clean up invalid tokens
-  Implement token rotation for security

### Data Privacy

-  Users can opt-out at any time
-  Notification data is logged with retention policies
-  GDPR compliant data handling

### Rate Limiting

-  Implement per-user rate limits
-  Batch notifications for efficiency
-  Monitor for abuse patterns

## Troubleshooting

### Common Issues

#### Notifications Not Received

1. Check browser/device permissions
2. Verify FCM token is valid
3. Check user preferences
4. Validate timezone settings

#### Service Worker Issues

1. Ensure service worker is registered
2. Check for console errors
3. Verify Firebase configuration
4. Test in different browsers

#### Schedule Not Running

1. Check cron service status
2. Verify database connectivity
3. Monitor application logs
4. Ensure proper timezone handling

### Debug Commands

```bash
# Check notification scheduler status
curl http://localhost:3000/api/notifications/scheduler/status

# Send test notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","title":"Test","body":"Test notification"}'

# Check user devices
curl http://localhost:3000/api/notifications/devices?userId=test_user
```

## Future Enhancements

### Planned Features

-  [ ] Rich notifications with images
-  [ ] Interactive notification actions
-  [ ] Smart delivery timing based on user activity
-  [ ] A/B testing for notification content
-  [ ] Push notification templates
-  [ ] Advanced analytics dashboard

### Performance Optimizations

-  [ ] Notification batching optimization
-  [ ] Database query optimization
-  [ ] Caching layer for user preferences
-  [ ] CDN for notification assets

## Support

For technical support or questions about the notification system:

1. Check the troubleshooting section above
2. Review application logs for errors
3. Test with the provided debug commands
4. Contact the development team with specific error details

## License

This notification system is part of the Restrain Yourself application and follows the same licensing terms.
