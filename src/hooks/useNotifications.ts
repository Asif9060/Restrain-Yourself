"use client";

import { useState, useEffect, useCallback } from "react";
import {
   getFCMToken,
   requestNotificationPermission,
   getDeviceInfo,
   onMessageListener,
} from "../../lib/firebase";

interface NotificationPayload {
   notification?: {
      title?: string;
      body?: string;
   };
   data?: Record<string, string>;
}

interface NotificationHookReturn {
   permission: NotificationPermission;
   isSupported: boolean;
   token: string | null;
   isRegistered: boolean;
   requestPermission: () => Promise<boolean>;
   registerDevice: (userId: string) => Promise<boolean>;
   unregisterDevice: () => Promise<boolean>;
   sendTestNotification: (userId: string) => Promise<boolean>;
   refreshToken: () => Promise<void>;
}

export function useNotifications(): NotificationHookReturn {
   const [permission, setPermission] = useState<NotificationPermission>("default");
   const [isSupported, setIsSupported] = useState(false);
   const [token, setToken] = useState<string | null>(null);
   const [isRegistered, setIsRegistered] = useState(false);

   const showForegroundNotification = useCallback(
      (payload: NotificationPayload) => {
         if (permission === "granted") {
            const title = payload.notification?.title || "Restrain Yourself";
            const options = {
               body: payload.notification?.body || "You have a new notification",
               icon: "/icon-192x192.png",
               badge: "/badge-72x72.png",
               tag: payload.data?.type || "default",
               data: payload.data,
               requireInteraction: true,
            };

            const notification = new Notification(title, options);

            notification.onclick = () => {
               window.focus();
               if (payload.data?.deep_link) {
                  window.location.href = payload.data.deep_link;
               }
               notification.close();
            };

            // Auto-close after 10 seconds
            setTimeout(() => {
               notification.close();
            }, 10000);
         }
      },
      [permission]
   );

   const refreshToken = useCallback(async (): Promise<void> => {
      if (permission !== "granted") {
         return;
      }

      try {
         const newToken = await getFCMToken();
         setToken(newToken);
      } catch (error) {
         console.error("Error getting FCM token:", error);
         setToken(null);
      }
   }, [permission]);

   useEffect(() => {
      // Check if notifications are supported
      if (typeof window !== "undefined" && "Notification" in window) {
         setIsSupported(true);
         setPermission(Notification.permission);
      }

      // Listen for foreground messages
      const setupMessageListener = async () => {
         try {
            const messageListener = await onMessageListener();
            if (messageListener) {
               console.log("Received foreground message:", messageListener);
               // Handle foreground notification display
               showForegroundNotification(messageListener as NotificationPayload);
            }
         } catch (error) {
            console.error("Error setting up message listener:", error);
         }
      };

      setupMessageListener();
   }, [showForegroundNotification]);

   useEffect(() => {
      // Get token when permission is granted
      if (permission === "granted") {
         refreshToken();
      }
   }, [permission, refreshToken]);

   const handleRequestPermission = useCallback(async (): Promise<boolean> => {
      if (!isSupported) {
         console.warn("Notifications are not supported in this browser");
         return false;
      }

      try {
         const granted = await requestNotificationPermission();
         setPermission(granted ? "granted" : "denied");
         return granted;
      } catch (error) {
         console.error("Error requesting notification permission:", error);
         return false;
      }
   }, [isSupported]);

   const registerDevice = useCallback(
      async (userId: string): Promise<boolean> => {
         console.log("registerDevice called with userId:", userId);
         console.log("Current token:", token);
         
         if (!token) {
            console.warn("No FCM token available for device registration");
            console.warn("Debug info:");
            console.warn("- Permission:", permission);
            console.warn("- isSupported:", isSupported);
            console.warn("- Window location:", typeof window !== "undefined" ? window.location.href : "Server-side");
            
            // Try to refresh the token
            console.log("Attempting to refresh token...");
            await refreshToken();
            
            if (!token) {
               console.error("Still no token after refresh attempt");
               return false;
            }
         }

         // Handle mock token for localhost development
         if (token.startsWith("mock-token-")) {
            console.log("Using mock token for localhost development");
            setIsRegistered(true);
            return true;
         }

         try {
            const deviceInfo = getDeviceInfo();

            const response = await fetch("/api/notifications/devices", {
               method: "POST",
               headers: {
                  "Content-Type": "application/json",
               },
               body: JSON.stringify({
                  userId,
                  deviceToken: token,
                  deviceInfo,
               }),
            });

            const success = response.ok;
            setIsRegistered(success);
            return success;
         } catch (error) {
            console.error("Error registering device:", error);
            return false;
         }
      },
      [token, permission, isSupported, refreshToken]
   );

   const unregisterDevice = useCallback(async (): Promise<boolean> => {
      if (!token) {
         return true; // Already unregistered
      }

      try {
         const response = await fetch("/api/notifications/devices", {
            method: "DELETE",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               deviceToken: token,
            }),
         });

         const success = response.ok;
         if (success) {
            setIsRegistered(false);
         }
         return success;
      } catch (error) {
         console.error("Error unregistering device:", error);
         return false;
      }
   }, [token]);

   const sendTestNotification = useCallback(
      async (userId: string): Promise<boolean> => {
         try {
            // For localhost with mock token, simulate a successful notification
            if (token && token.startsWith("mock-token-")) {
               console.log("Simulating test notification for localhost development");

               // Show a browser notification if possible
               if (permission === "granted") {
                  new Notification("Test Notification", {
                     body: "This is a test notification from your habit tracker!",
                     icon: "/icon-192x192.svg",
                     tag: "test-notification",
                  });
               }

               return true;
            }

            const response = await fetch(
               `/api/notifications/send?userId=${userId}&action=test`
            );
            const result = await response.json();
            return result.success;
         } catch (error) {
            console.error("Error sending test notification:", error);
            return false;
         }
      },
      [token, permission]
   );

   return {
      permission,
      isSupported,
      token,
      isRegistered,
      requestPermission: handleRequestPermission,
      registerDevice,
      unregisterDevice,
      sendTestNotification,
      refreshToken,
   };
}

export default useNotifications;
