// Firebase configuration
import { initializeApp, getApps, getApp } from "firebase/app";
import {
   getMessaging,
   getToken,
   onMessage,
   isSupported,
   Messaging,
} from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Cloud Messaging
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
   isSupported().then((supported) => {
      if (supported) {
         messaging = getMessaging(app);
      }
   });
}

export { app, messaging };
export const auth = getAuth(app);

// Register service worker
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
   if ("serviceWorker" in navigator) {
      try {
         console.log("Unregistering existing service workers...");
         // Unregister any existing service workers first
         const existingRegistrations = await navigator.serviceWorker.getRegistrations();
         console.log("Found existing registrations:", existingRegistrations.length);
         
         for (const registration of existingRegistrations) {
            if (registration.scope.includes("firebase-cloud-messaging-push-scope")) {
               console.log("Unregistering existing FCM service worker");
               await registration.unregister();
            }
         }

         console.log("Registering new service worker at /firebase-messaging-sw.js");
         const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            {
               scope: "/firebase-cloud-messaging-push-scope",
            }
         );

         console.log("Service worker registration object:", registration);
         
         // Wait for the service worker to be ready
         console.log("Waiting for service worker to be ready...");
         const readyRegistration = await navigator.serviceWorker.ready;
         console.log("Service worker is ready:", readyRegistration);

         console.log("Service Worker registered successfully:", registration);
         return registration;
      } catch (err) {
         const error = err as Error;
         console.error("Service Worker registration failed:", error);
         console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
         });
         throw error;
      }
   } else {
      throw new Error("Service Worker is not supported in this browser");
   }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
   try {
      // Debug environment variables
      console.log("Firebase Config Debug:");
      console.log("API Key:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing");
      console.log("Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing");
      console.log("VAPID Key:", process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? "✅ Set" : "❌ Missing");
      
      if (!messaging) {
         console.warn("Firebase messaging is not supported in this environment");
         console.log("Current location:", typeof window !== "undefined" ? window.location.href : "Server-side");
         console.log("User agent:", typeof window !== "undefined" ? navigator.userAgent : "Server-side");

         // Return mock token for development
         if (typeof window !== "undefined" && window.location.hostname === "localhost") {
            console.log("Returning mock token for localhost (messaging not supported)");
            return "mock-token-messaging-" + Date.now();
         }
         return null;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
         console.error("VAPID key is not configured");
         console.error("Environment check:");
         console.error("- NODE_ENV:", process.env.NODE_ENV);
         console.error("- All env vars:", Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE')));

         // Return mock token for development
         if (typeof window !== "undefined" && window.location.hostname === "localhost") {
            console.log("Returning mock token for localhost (no VAPID key)");
            return "mock-token-vapid-" + Date.now();
         }
         return null;
      }

      // Register service worker first
      console.log("Attempting to register service worker...");
      console.log("Location origin:", window.location.origin);
      console.log("Service worker availability:", 'serviceWorker' in navigator);
      
      const registration = await registerServiceWorker();
      console.log("Service worker registered successfully");

      // Wait a bit for service worker to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(
         "Requesting FCM token with VAPID key:",
         vapidKey.substring(0, 20) + "..."
      );

      const token = await getToken(messaging, {
         vapidKey,
         serviceWorkerRegistration: registration,
      });

      if (token) {
         console.log("FCM token obtained successfully:", token.substring(0, 20) + "...");
      } else {
         console.warn("FCM token is empty");
      }

      return token || null;
   } catch (err) {
      const error = err as Error & { code?: string };
      console.error("Error getting FCM token:", error);

      // Always return mock token for localhost development
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
         console.warn("Returning mock token for localhost development due to FCM error");
         return "mock-token-error-" + Date.now();
      }

      // Provide more specific error messages
      if (error?.code === "messaging/failed-service-worker-registration") {
         console.error(
            "Service worker registration failed. Check if the service worker file exists and is valid."
         );
      } else if (error?.code === "messaging/permission-blocked") {
         console.error(
            "Notification permission is blocked. Please enable notifications in browser settings."
         );
      } else if (error?.code === "messaging/registration-token-not-available") {
         console.error(
            "Registration token not available. This may be due to network issues or invalid VAPID key."
         );
      } else if (
         error?.name === "AbortError" &&
         error?.message?.includes("push service error")
      ) {
         console.error("Push service error - this often occurs on localhost. Try:");
         console.error("1. Testing on HTTPS (deploy to Vercel/Netlify)");
         console.error("2. Using Chrome with --disable-web-security flag");
         console.error("3. Testing on a different browser");
      }

      return null;
   }
};

// Listen for foreground messages
export const onMessageListener = () =>
   new Promise((resolve) => {
      if (!messaging) {
         resolve(null);
         return;
      }

      onMessage(messaging, (payload) => {
         console.log("Received foreground message:", payload);
         resolve(payload);
      });
   });

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
   try {
      if (!("Notification" in window)) {
         console.warn("This browser does not support notifications");
         return false;
      }

      if (Notification.permission === "granted") {
         return true;
      }

      if (Notification.permission === "denied") {
         console.warn("Notification permission is denied");
         return false;
      }

      const permission = await Notification.requestPermission();
      return permission === "granted";
   } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
   }
};

// Get device info
export const getDeviceInfo = () => {
   const userAgent = navigator.userAgent;
   const isIOS = /iPad|iPhone|iPod/.test(userAgent);
   const isAndroid = /Android/.test(userAgent);

   let deviceType = "web";
   if (isIOS) deviceType = "ios";
   else if (isAndroid) deviceType = "android";

   return {
      type: deviceType,
      name: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device`,
      platformVersion: navigator.platform,
      userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
   };
};
