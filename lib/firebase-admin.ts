// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert, ServiceAccount, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import path from "path";
import fs from "fs";

// Initialize Firebase Admin
let adminApp: App | null = null;

const initializeFirebaseAdmin = () => {
   if (getApps().length === 0) {
      try {
         // Try to load service account from file
         const serviceAccountPath = path.join(
            process.cwd(),
            "config",
            "firebase-service-account.json"
         );
         let serviceAccount: ServiceAccount;

         if (fs.existsSync(serviceAccountPath)) {
            const serviceAccountData = fs.readFileSync(serviceAccountPath, "utf8");
            serviceAccount = JSON.parse(serviceAccountData);
         } else {
            // Fallback to environment variables
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
            if (
               !privateKey ||
               !process.env.FIREBASE_PROJECT_ID ||
               !process.env.FIREBASE_CLIENT_EMAIL
            ) {
               throw new Error("Missing Firebase configuration");
            }

            serviceAccount = {
               projectId: process.env.FIREBASE_PROJECT_ID,
               clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
               privateKey,
            };
         }

         adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId,
         });

         console.log("Firebase Admin initialized successfully");
      } catch (error) {
         console.error("Error initializing Firebase Admin:", error);
         throw error;
      }
   } else {
      adminApp = getApps()[0];
   }

   return adminApp;
};

// Get messaging instance
export const getAdminMessaging = () => {
   if (!adminApp) {
      initializeFirebaseAdmin();
   }
   if (!adminApp) {
      throw new Error("Failed to initialize Firebase Admin");
   }
   return getMessaging(adminApp);
};

// Send notification to a single device
export const sendNotificationToDevice = async (
   deviceToken: string,
   title: string,
   body: string,
   data?: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
   try {
      const messaging = getAdminMessaging();

      const message = {
         token: deviceToken,
         notification: {
            title,
            body,
         },
         data: data || {},
         android: {
            notification: {
               icon: "/icon-192x192.png",
               color: "#6366f1",
               defaultSound: true,
               defaultVibrateTimings: true,
               priority: "high" as const,
            },
            ttl: 24 * 60 * 60 * 1000, // 24 hours
         },
         apns: {
            payload: {
               aps: {
                  badge: 1,
                  sound: "default",
                  "content-available": 1,
                  "mutable-content": 1,
               },
            },
            fcm_options: {
               image: "/icon-192x192.png",
            },
         },
         webpush: {
            notification: {
               icon: "/icon-192x192.png",
               badge: "/badge-72x72.png",
               requireInteraction: true,
               tag: "habit-reminder",
               actions: [
                  {
                     action: "view",
                     title: "View Habits",
                     icon: "/icon-192x192.png",
                  },
                  {
                     action: "dismiss",
                     title: "Dismiss",
                  },
               ],
            },
            fcm_options: {
               link: process.env.NEXT_PUBLIC_APP_URL || "https://restrainyourself.com",
            },
         },
      };

      const response = await messaging.send(message);

      return {
         success: true,
         messageId: response,
      };
   } catch (error: unknown) {
      console.error("Error sending notification:", error);

      return {
         success: false,
         error: error instanceof Error ? error.message : "Unknown error occurred",
      };
   }
};

// Send notifications to multiple devices (batch)
export const sendNotificationToMultipleDevices = async (
   deviceTokens: string[],
   title: string,
   body: string,
   data?: Record<string, string>
): Promise<{
   successCount: number;
   failureCount: number;
   responses: Array<{
      success: boolean;
      messageId?: string;
      error?: string;
      token: string;
   }>;
}> => {
   const messaging = getAdminMessaging();

   const message = {
      notification: {
         title,
         body,
      },
      data: data || {},
      android: {
         notification: {
            icon: "/icon-192x192.png",
            color: "#6366f1",
            defaultSound: true,
            defaultVibrateTimings: true,
            priority: "high" as const,
         },
         ttl: 24 * 60 * 60 * 1000,
      },
      apns: {
         payload: {
            aps: {
               badge: 1,
               sound: "default",
               "content-available": 1,
               "mutable-content": 1,
            },
         },
         fcm_options: {
            image: "/icon-192x192.png",
         },
      },
      webpush: {
         notification: {
            icon: "/icon-192x192.png",
            badge: "/badge-72x72.png",
            requireInteraction: true,
            tag: "habit-reminder",
         },
         fcm_options: {
            link: process.env.NEXT_PUBLIC_APP_URL || "https://restrainyourself.com",
         },
      },
      tokens: deviceTokens,
   };

   try {
      const response = await messaging.sendEachForMulticast(message);

      const results = response.responses.map((resp, index) => ({
         success: resp.success,
         messageId: resp.messageId,
         error: resp.error?.message,
         token: deviceTokens[index],
      }));

      return {
         successCount: response.successCount,
         failureCount: response.failureCount,
         responses: results,
      };
   } catch (error: unknown) {
      console.error("Error sending batch notifications:", error);

      // Return failure for all tokens
      return {
         successCount: 0,
         failureCount: deviceTokens.length,
         responses: deviceTokens.map((token) => ({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
            token,
         })),
      };
   }
};

// Validate FCM token
export const validateFCMToken = async (token: string): Promise<boolean> => {
   try {
      const messaging = getAdminMessaging();

      // Try to send a dry-run message to validate the token
      await messaging.send(
         {
            token,
            notification: {
               title: "Test",
               body: "Test",
            },
         },
         true
      ); // dry-run mode

      return true;
   } catch (error: unknown) {
      console.error(
         "Invalid FCM token:",
         error instanceof Error ? error.message : "Unknown error"
      );
      return false;
   }
};

// Initialize on module load
initializeFirebaseAdmin();
