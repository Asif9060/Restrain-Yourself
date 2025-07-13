Implement a mobile push notification system for habit tracking with the following specifications:

1. Create a notification service that:
   - Sends daily reminders to users who have not marked their habits
   - Triggers at 10:30 PM local time
   - Supports cross-platform mobile notifications (iOS and Android)

2. Technical requirements:
   - Use a reliable push notification service (e.g., Firebase Cloud Messaging, OneSignal)
   - Implement timezone handling for accurate delivery timing
   - Include proper error handling and delivery status tracking
   - Store user notification preferences and settings

3. Notification content:
   - Clear reminder message about unmarked habits
   - Deep link to the specific habit tracking page
   - Respect system notification permissions
   - Allow users to opt-out or customize timing

4. Performance considerations:
   - Batch notifications for efficiency
   - Implement retry logic for failed deliveries
   - Monitor notification delivery rates
   - Optimize battery usage on mobile devices

Please provide your preferred notification service and any specific platform constraints before implementation.