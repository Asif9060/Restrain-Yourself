// Debug script to test Firebase configuration
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("Environment Variables:");
console.log("NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("NEXT_PUBLIC_FIREBASE_VAPID_KEY:", process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);

console.log("\nFirebase Config:");
console.log(firebaseConfig);

const app = initializeApp(firebaseConfig);

async function testFirebase() {
   try {
      console.log("\nTesting Firebase messaging support...");
      const supported = await isSupported();
      console.log("Messaging supported:", supported);
      
      if (!supported) {
         console.log("❌ Firebase messaging is not supported in this environment");
         return;
      }
      
      const messaging = getMessaging(app);
      console.log("✅ Messaging instance created:", messaging ? "Valid" : "Invalid");
      
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
         console.log("❌ VAPID key is missing");
         return;
      }
      
      console.log("✅ VAPID key found:", vapidKey.substring(0, 20) + "...");
      
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      console.log("Is secure context:", isSecure);
      
      if (!isSecure) {
         console.log("❌ FCM requires HTTPS or localhost");
         return;
      }
      
      console.log("✅ Secure context confirmed");
      
   } catch (error) {
      console.error("❌ Firebase test failed:", error);
   }
}

if (typeof window !== 'undefined') {
   testFirebase();
}
