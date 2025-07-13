import { createClient } from "@supabase/supabase-js";
import { sendNotificationToDevice } from "../lib/firebase-admin";

// Create a generic supabase client for notification tables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface NotificationPreferences {
   id?: string;
   user_id: string;
   enabled: boolean;
   reminder_time: string; // HH:MM format
   timezone: string;
   days_of_week: number[];
   reminder_buffer_hours: number;
   sound_enabled: boolean;
   vibration_enabled: boolean;
   badge_enabled: boolean;
}

export interface UserDevice {
   id?: string;
   user_id: string;
   device_token: string;
   device_type: "ios" | "android" | "web";
   device_name?: string;
   platform_version?: string;
   app_version?: string;
   is_active: boolean;
   timezone: string;
}

export interface NotificationLog {
   id?: string;
   user_id: string;
   device_token: string;
   notification_type: "daily_reminder" | "habit_streak" | "motivational" | "achievement";
   title: string;
   body: string;
   data?: Record<string, string | number | boolean>;
   status: "pending" | "sent" | "delivered" | "failed" | "clicked";
   error_message?: string;
   scheduled_for: string;
   retry_count: number;
   max_retries: number;
}

export class NotificationService {
   // Register a new device for notifications
   static async registerDevice(
      userId: string,
      deviceToken: string,
      deviceInfo: Partial<UserDevice>
   ): Promise<boolean> {
      try {
         const { error } = await supabase.from("user_devices").upsert(
            {
               user_id: userId,
               device_token: deviceToken,
               device_type: deviceInfo.device_type || "web",
               device_name: deviceInfo.device_name,
               platform_version: deviceInfo.platform_version,
               app_version: deviceInfo.app_version || "1.0.0",
               is_active: true,
               timezone: deviceInfo.timezone || "UTC",
               last_used_at: new Date().toISOString(),
            },
            {
               onConflict: "device_token",
            }
         );

         if (error) {
            console.error("Error registering device:", error);
            return false;
         }

         return true;
      } catch (error) {
         console.error("Error registering device:", error);
         return false;
      }
   }

   // Update device status
   static async updateDeviceStatus(
      deviceToken: string,
      isActive: boolean
   ): Promise<boolean> {
      try {
         const { error } = await supabase
            .from("user_devices")
            .update({
               is_active: isActive,
               last_used_at: new Date().toISOString(),
            })
            .eq("device_token", deviceToken);

         return !error;
      } catch (error) {
         console.error("Error updating device status:", error);
         return false;
      }
   }

   // Get or create notification preferences for a user
   static async getNotificationPreferences(
      userId: string
   ): Promise<NotificationPreferences | null> {
      try {
         const { data, error } = await supabase
            .from("notification_preferences")
            .select("*")
            .eq("user_id", userId)
            .single();

         if (error && error.code === "PGRST116") {
            // No preferences found, create default ones
            const defaultPrefs: Partial<NotificationPreferences> = {
               user_id: userId,
               enabled: true,
               reminder_time: "22:30:00",
               timezone: "UTC",
               days_of_week: [1, 2, 3, 4, 5, 6, 7],
               reminder_buffer_hours: 2,
               sound_enabled: true,
               vibration_enabled: true,
               badge_enabled: true,
            };

            const { data: newData, error: insertError } = await supabase
               .from("notification_preferences")
               .insert(defaultPrefs)
               .select()
               .single();

            if (insertError) {
               console.error("Error creating default preferences:", insertError);
               return null;
            }

            return newData;
         } else if (error) {
            console.error("Error fetching preferences:", error);
            return null;
         }

         return data;
      } catch (error) {
         console.error("Error getting notification preferences:", error);
         return null;
      }
   }

   // Update notification preferences
   static async updateNotificationPreferences(
      userId: string,
      preferences: Partial<NotificationPreferences>
   ): Promise<boolean> {
      try {
         const { error } = await supabase
            .from("notification_preferences")
            .update(preferences)
            .eq("user_id", userId);

         return !error;
      } catch (error) {
         console.error("Error updating preferences:", error);
         return false;
      }
   }

   // Get active devices for a user
   static async getUserDevices(userId: string): Promise<UserDevice[]> {
      try {
         const { data, error } = await supabase
            .from("user_devices")
            .select("*")
            .eq("user_id", userId)
            .eq("is_active", true);

         if (error) {
            console.error("Error fetching user devices:", error);
            return [];
         }

         return data || [];
      } catch (error) {
         console.error("Error fetching user devices:", error);
         return [];
      }
   }

   // Log notification attempt
   static async logNotification(
      notification: Partial<NotificationLog>
   ): Promise<string | null> {
      try {
         const { data, error } = await supabase
            .from("notification_logs")
            .insert({
               ...notification,
               created_at: new Date().toISOString(),
            })
            .select("id")
            .single();

         if (error) {
            console.error("Error logging notification:", error);
            return null;
         }

         return data.id;
      } catch (error) {
         console.error("Error logging notification:", error);
         return null;
      }
   }

   // Update notification status
   static async updateNotificationStatus(
      notificationId: string,
      status: NotificationLog["status"],
      errorMessage?: string
   ): Promise<boolean> {
      try {
         const updateData: Record<string, string | Date> = { status };

         if (status === "delivered") {
            updateData.delivered_at = new Date().toISOString();
         } else if (status === "clicked") {
            updateData.clicked_at = new Date().toISOString();
         } else if (status === "sent") {
            updateData.sent_at = new Date().toISOString();
         }

         if (errorMessage) {
            updateData.error_message = errorMessage;
         }

         const { error } = await supabase
            .from("notification_logs")
            .update(updateData)
            .eq("id", notificationId);

         return !error;
      } catch (error) {
         console.error("Error updating notification status:", error);
         return false;
      }
   }

   // Send notification to a single user
   static async sendNotificationToUser(
      userId: string,
      title: string,
      body: string,
      type: NotificationLog["notification_type"] = "daily_reminder",
      data?: Record<string, string>
   ): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
      try {
         // Check user preferences
         const preferences = await this.getNotificationPreferences(userId);
         if (!preferences || !preferences.enabled) {
            return { success: false, sentCount: 0, failedCount: 0 };
         }

         // Get user's active devices
         const devices = await this.getUserDevices(userId);
         if (devices.length === 0) {
            return { success: false, sentCount: 0, failedCount: 0 };
         }

         let sentCount = 0;
         let failedCount = 0;

         // Send to each device
         for (const device of devices) {
            // Log the notification attempt
            const logId = await this.logNotification({
               user_id: userId,
               device_token: device.device_token,
               notification_type: type,
               title,
               body,
               data,
               status: "pending",
               scheduled_for: new Date().toISOString(),
               retry_count: 0,
               max_retries: 3,
            });

            // Send the notification
            const result = await sendNotificationToDevice(
               device.device_token,
               title,
               body,
               data
            );

            if (result.success) {
               sentCount++;
               if (logId) {
                  await this.updateNotificationStatus(logId, "sent");
               }
            } else {
               failedCount++;
               if (logId) {
                  await this.updateNotificationStatus(logId, "failed", result.error);
               }

               // If token is invalid, deactivate the device
               if (
                  result.error?.includes("registration-token-not-registered") ||
                  result.error?.includes("invalid-registration-token")
               ) {
                  await this.updateDeviceStatus(device.device_token, false);
               }
            }
         }

         return {
            success: sentCount > 0,
            sentCount,
            failedCount,
         };
      } catch (error) {
         console.error("Error sending notification to user:", error);
         return { success: false, sentCount: 0, failedCount: 1 };
      }
   }

   // Get users who need daily reminders
   static async getUsersNeedingReminders(): Promise<
      Array<{
         user_id: string;
         device_tokens: string[];
         timezone: string;
         unmarked_habits: number;
      }>
   > {
      try {
         // Use the database function to get users needing reminders
         const { data, error } = await supabase.rpc("get_users_needing_reminders", {
            target_time: new Date().toISOString(),
         });

         if (error) {
            console.error("Error getting users needing reminders:", error);
            return [];
         }

         return data || [];
      } catch (error) {
         console.error("Error getting users needing reminders:", error);
         return [];
      }
   }

   // Send daily reminders to all eligible users
   static async sendDailyReminders(): Promise<{
      totalUsers: number;
      successfulUsers: number;
      totalNotifications: number;
      successfulNotifications: number;
   }> {
      try {
         const usersNeedingReminders = await this.getUsersNeedingReminders();

         let successfulUsers = 0;
         let totalNotifications = 0;
         let successfulNotifications = 0;

         for (const user of usersNeedingReminders) {
            const title = "Don't forget your habits! 🎯";
            const body = `You have ${user.unmarked_habits} habit${
               user.unmarked_habits > 1 ? "s" : ""
            } to track today. Keep up the great work!`;

            const data = {
               type: "daily_reminder",
               unmarked_count: user.unmarked_habits.toString(),
               deep_link: "/dashboard",
            };

            const result = await this.sendNotificationToUser(
               user.user_id,
               title,
               body,
               "daily_reminder",
               data
            );

            totalNotifications += result.sentCount + result.failedCount;
            successfulNotifications += result.sentCount;

            if (result.success) {
               successfulUsers++;
            }
         }

         return {
            totalUsers: usersNeedingReminders.length,
            successfulUsers,
            totalNotifications,
            successfulNotifications,
         };
      } catch (error) {
         console.error("Error sending daily reminders:", error);
         return {
            totalUsers: 0,
            successfulUsers: 0,
            totalNotifications: 0,
            successfulNotifications: 0,
         };
      }
   }

   // Get notification statistics
   static async getNotificationStats(
      userId?: string,
      days: number = 7
   ): Promise<{
      totalSent: number;
      totalDelivered: number;
      totalClicked: number;
      totalFailed: number;
      deliveryRate: number;
      clickRate: number;
   }> {
      try {
         let query = supabase
            .from("notification_logs")
            .select("status")
            .gte(
               "created_at",
               new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
            );

         if (userId) {
            query = query.eq("user_id", userId);
         }

         const { data, error } = await query;

         if (error) {
            console.error("Error fetching notification stats:", error);
            return {
               totalSent: 0,
               totalDelivered: 0,
               totalClicked: 0,
               totalFailed: 0,
               deliveryRate: 0,
               clickRate: 0,
            };
         }

         const stats = {
            totalSent: 0,
            totalDelivered: 0,
            totalClicked: 0,
            totalFailed: 0,
            deliveryRate: 0,
            clickRate: 0,
         };

         data?.forEach((log: { status: string }) => {
            switch (log.status) {
               case "sent":
               case "delivered":
                  stats.totalSent++;
                  if (log.status === "delivered") {
                     stats.totalDelivered++;
                  }
                  break;
               case "clicked":
                  stats.totalSent++;
                  stats.totalDelivered++;
                  stats.totalClicked++;
                  break;
               case "failed":
                  stats.totalFailed++;
                  break;
            }
         });

         stats.deliveryRate =
            stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0;
         stats.clickRate =
            stats.totalDelivered > 0
               ? (stats.totalClicked / stats.totalDelivered) * 100
               : 0;

         return stats;
      } catch (error) {
         console.error("Error getting notification stats:", error);
         return {
            totalSent: 0,
            totalDelivered: 0,
            totalClicked: 0,
            totalFailed: 0,
            deliveryRate: 0,
            clickRate: 0,
         };
      }
   }
}
