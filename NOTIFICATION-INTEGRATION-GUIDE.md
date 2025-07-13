# Push Notification Integration Guide

## Overview

This guide shows how to integrate the complete push notification system into your existing Restrain Yourself habit tracking application.

## ✅ What Has Been Implemented

### 1. Database Schema (`database/notifications-schema.sql`)

-  **user_devices**: Store FCM tokens and device information
-  **notification_preferences**: User notification settings and preferences
-  **notification_logs**: Track delivery status and analytics
-  **notification_batches**: Batch processing management
-  **SQL functions**: For getting users needing reminders and updating status

### 2. Firebase Configuration (`lib/firebase.ts`, `lib/firebase-admin.ts`)

-  Client-side Firebase messaging setup
-  Server-side Firebase Admin SDK for sending notifications
-  Token management and device registration
-  Cross-platform support (iOS, Android, Web)

### 3. Notification Service (`services/NotificationService.ts`)

-  Device registration and management
-  User preference handling
-  Notification sending logic
-  Analytics and delivery tracking
-  Timezone-aware reminder system

### 4. Scheduling System (`lib/notification-scheduler.ts`)

-  Cron-based scheduler running every 15 minutes
-  Daily reminders at 10:30 PM local time
-  Motivational and achievement notifications
-  Streak notifications for habit milestones

### 5. API Endpoints (`src/app/api/notifications/`)

-  **devices**: Register/unregister devices
-  **preferences**: Manage user notification settings
-  **send**: Send notifications manually or for testing
-  **stats**: View notification analytics

### 6. React Components

-  **NotificationSettings**: Complete settings UI for users
-  **NotificationDashboard**: Analytics dashboard for admins
-  **useNotifications**: React hook for notification management

### 7. Service Worker (`public/firebase-messaging-sw.js`)

-  Background notification handling
-  Click tracking and deep linking
-  Offline support and caching

## 🚀 Integration Steps

### Step 1: Add Notification Settings to User Dashboard

```typescript
// In your existing dashboard component
import NotificationSettings from "@/components/NotificationSettings";
import { useNotifications } from "@/hooks/useNotifications";

export default function Dashboard() {
   const { user } = useAuth(); // Your existing auth context
   const notifications = useNotifications();

   return (
      <div className="dashboard">
         {/* Your existing dashboard content */}

         {/* Add notification settings */}
         <div className="notification-section">
            <NotificationSettings userId={user.id} />
         </div>
      </div>
   );
}
```

### Step 2: Initialize Notifications on App Start

```typescript
// In your app layout or main component
import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export default function AppLayout({ children }: { children: React.ReactNode }) {
   const { user } = useAuth();
   const { requestPermission, registerDevice } = useNotifications();

   useEffect(() => {
      if (user && "Notification" in window) {
         // Auto-request permission and register device
         const initNotifications = async () => {
            const granted = await requestPermission();
            if (granted) {
               await registerDevice(user.id);
            }
         };

         initNotifications();
      }
   }, [user, requestPermission, registerDevice]);

   return <>{children}</>;
}
```

### Step 3: Add Admin Dashboard (Optional)

```typescript
// For admin users to view notification analytics
import NotificationDashboard from "@/components/NotificationDashboard";

export default function AdminDashboard() {
   return (
      <div className="admin-dashboard">
         <h1>Admin Dashboard</h1>
         <NotificationDashboard />
      </div>
   );
}
```

### Step 4: Send Achievement Notifications

```typescript
// When a user completes a streak or achievement
import { NotificationScheduler } from "@/lib/notification-scheduler";

// Example: When user completes 7-day streak
const handleStreakAchievement = async (
   userId: string,
   habitName: string,
   days: number
) => {
   if (days === 7 || days === 30 || days === 100) {
      await NotificationScheduler.sendStreakNotification(userId, habitName, days);
   }
};

// Example: Send motivational content
const sendDailyMotivation = async (userId: string) => {
   const quotes = await getMotivationalQuotes(); // Your existing quotes
   const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

   await NotificationScheduler.sendMotivationalNotification(
      userId,
      randomQuote.text,
      randomQuote.author
   );
};
```

### Step 5: Update Your Habit Tracking Logic

```typescript
// In your habit tracking service, add notification logic
import { NotificationScheduler } from "@/lib/notification-scheduler";

export const markHabitComplete = async (
   userId: string,
   habitId: string,
   date: string
) => {
   // Your existing habit completion logic
   const result = await completeHabit(userId, habitId, date);

   // Check for streaks and send notifications
   if (result.streakLength > 0 && result.streakLength % 7 === 0) {
      await NotificationScheduler.sendStreakNotification(
         userId,
         result.habitName,
         result.streakLength
      );
   }

   return result;
};
```

## 🔧 Configuration Required

### 1. Environment Variables (`.env.local`)

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceacument.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Firebase Project Setup

1. Create Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Generate Web Push certificates (VAPID key)
4. Download service account JSON
5. Configure authorized domains

### 3. Database Schema

Apply the SQL schema to your Supabase database:

```bash
# Copy the contents of database/notifications-schema.sql
# Paste into Supabase SQL Editor and run
```

## 🧪 Testing

### Test Notification Flow

```typescript
// Test complete notification flow
const testNotifications = async (userId: string) => {
   // 1. Test device registration
   const { registerDevice } = useNotifications();
   await registerDevice(userId);

   // 2. Test preference management
   const response = await fetch(`/api/notifications/preferences?userId=${userId}`);
   console.log("Preferences:", await response.json());

   // 3. Send test notification
   const testResponse = await fetch(
      `/api/notifications/send?userId=${userId}&action=test`
   );
   console.log("Test result:", await testResponse.json());

   // 4. Check analytics
   const statsResponse = await fetch(`/api/notifications/stats?userId=${userId}`);
   console.log("Stats:", await statsResponse.json());
};
```

## 🔗 Deep Linking

Notifications automatically deep link to your app. Configure routes:

```typescript
// In your routing logic
const handleNotificationClick = (data: any) => {
   switch (data.type) {
      case "daily_reminder":
         router.push("/dashboard");
         break;
      case "habit_streak":
         router.push(`/habits/${data.habit_id}`);
         break;
      case "achievement":
         router.push("/achievements");
         break;
      default:
         router.push("/dashboard");
   }
};
```

## 📊 Monitoring

Monitor notification performance:

```typescript
// Add to your analytics/monitoring
const trackNotificationMetrics = async () => {
   const stats = await fetch("/api/notifications/stats").then((r) => r.json());

   // Send to your analytics service
   analytics.track("notification_performance", {
      delivery_rate: stats.deliveryRate,
      click_rate: stats.clickRate,
      total_sent: stats.totalSent,
   });
};
```

## 🔒 Security Considerations

1. **Token Management**: FCM tokens are automatically validated and cleaned up
2. **Rate Limiting**: Implement rate limits in production
3. **User Consent**: Always request permission before registering devices
4. **Data Privacy**: Users can opt-out and delete their notification data

## 🚀 Production Deployment

1. **Environment**: Set NODE_ENV=production to auto-start scheduler
2. **Monitoring**: Set up alerts for failed notifications
3. **Scaling**: Consider using a queue system for high-volume notifications
4. **Backup**: Implement retry logic for critical notifications

## 📈 Future Enhancements

-  Rich notifications with images
-  Interactive notification actions
-  Smart delivery timing based on user activity
-  A/B testing for notification content
-  Advanced analytics dashboard

## 🆘 Troubleshooting

### Common Issues:

1. **Notifications not received**: Check permissions and device registration
2. **Service worker errors**: Verify Firebase configuration
3. **Schedule not running**: Check server logs and cron status
4. **Database errors**: Verify schema is applied correctly

### Debug Commands:

```bash
# Run setup script
npm run setup:notifications

# Check notification stats
curl http://localhost:3000/api/notifications/stats

# Send test notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user","title":"Test","body":"Test"}'
```

---

Your push notification system is now ready! Users will receive timely reminders at 10:30 PM local time, and you can track engagement through the analytics dashboard. The system scales automatically and handles multiple devices per user with proper error handling and retry logic.
