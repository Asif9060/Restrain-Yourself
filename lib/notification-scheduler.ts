import * as cron from "node-cron";
import { NotificationService } from "../services/NotificationService";

export class NotificationScheduler {
   private static isRunning = false;
   private static cronJob: cron.ScheduledTask | null = null;

   // Start the notification scheduler
   static start(): void {
      if (this.isRunning) {
         console.log("Notification scheduler is already running");
         return;
      }

      // Schedule daily reminder notifications to run every 15 minutes
      // This allows us to catch users in different timezones at their preferred 10:30 PM time
      this.cronJob = cron.schedule(
         "*/15 * * * *",
         async () => {
            console.log("Running scheduled notification check...");
            await this.processDailyReminders();
         },
         {
            timezone: "UTC",
         }
      );

      this.isRunning = true;
      console.log("Notification scheduler started - checking every 15 minutes");
   }

   // Stop the notification scheduler
   static stop(): void {
      if (this.cronJob) {
         this.cronJob.stop();
         this.cronJob = null;
      }
      this.isRunning = false;
      console.log("Notification scheduler stopped");
   }

   // Process daily reminder notifications
   private static async processDailyReminders(): Promise<void> {
      try {
         console.log("Processing daily reminders...");
         const results = await NotificationService.sendDailyReminders();

         console.log("Daily reminder results:", {
            totalUsers: results.totalUsers,
            successfulUsers: results.successfulUsers,
            totalNotifications: results.totalNotifications,
            successfulNotifications: results.successfulNotifications,
         });

         // Log summary to database or external monitoring service
         if (results.totalUsers > 0) {
            await this.logBatchResults("daily_reminder", results);
         }
      } catch (error) {
         console.error("Error processing daily reminders:", error);
      }
   }

   // Log batch processing results
   private static async logBatchResults(
      batchType: string,
      results: {
         totalUsers: number;
         successfulUsers: number;
         totalNotifications: number;
         successfulNotifications: number;
      }
   ): Promise<void> {
      try {
         // You can implement additional logging here
         // For example, save to a monitoring table or send to external service
         console.log(`Batch ${batchType} completed:`, results);
      } catch (error) {
         console.error("Error logging batch results:", error);
      }
   }

   // Send immediate notification for testing
   static async sendTestNotification(userId: string): Promise<boolean> {
      try {
         const result = await NotificationService.sendNotificationToUser(
            userId,
            "Test Notification 🧪",
            "This is a test notification from Restrain Yourself!",
            "motivational",
            {
               type: "test",
               deep_link: "/dashboard",
            }
         );

         return result.success;
      } catch (error) {
         console.error("Error sending test notification:", error);
         return false;
      }
   }

   // Send motivational notification
   static async sendMotivationalNotification(
      userId: string,
      quote: string,
      author: string
   ): Promise<boolean> {
      try {
         const result = await NotificationService.sendNotificationToUser(
            userId,
            "💪 Daily Motivation",
            `"${quote}" - ${author}`,
            "motivational",
            {
               type: "motivational",
               quote,
               author,
               deep_link: "/dashboard",
            }
         );

         return result.success;
      } catch (error) {
         console.error("Error sending motivational notification:", error);
         return false;
      }
   }

   // Send achievement notification
   static async sendAchievementNotification(
      userId: string,
      achievementTitle: string,
      achievementDescription: string
   ): Promise<boolean> {
      try {
         const result = await NotificationService.sendNotificationToUser(
            userId,
            `🎉 ${achievementTitle}`,
            achievementDescription,
            "achievement",
            {
               type: "achievement",
               title: achievementTitle,
               deep_link: "/dashboard",
            }
         );

         return result.success;
      } catch (error) {
         console.error("Error sending achievement notification:", error);
         return false;
      }
   }

   // Send streak notification
   static async sendStreakNotification(
      userId: string,
      habitName: string,
      streakDays: number
   ): Promise<boolean> {
      try {
         const title = `🔥 ${streakDays} Day Streak!`;
         const body = `Congratulations! You've maintained your "${habitName}" habit for ${streakDays} days in a row!`;

         const result = await NotificationService.sendNotificationToUser(
            userId,
            title,
            body,
            "habit_streak",
            {
               type: "streak",
               habit_name: habitName,
               streak_days: streakDays.toString(),
               deep_link: "/dashboard",
            }
         );

         return result.success;
      } catch (error) {
         console.error("Error sending streak notification:", error);
         return false;
      }
   }

   // Get scheduler status
   static getStatus(): { isRunning: boolean; nextRun?: string } {
      return {
         isRunning: this.isRunning,
         nextRun: this.cronJob ? "Every 15 minutes" : undefined,
      };
   }
}

// Auto-start the scheduler in production
if (process.env.NODE_ENV === "production") {
   NotificationScheduler.start();
}
