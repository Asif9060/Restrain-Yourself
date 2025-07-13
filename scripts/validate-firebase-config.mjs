#!/usr/bin/env node

import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

console.log("🔍 Validating Firebase Configuration...\n");

const requiredVars = {
   NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
   NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
   NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
   FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
   FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
};

let allValid = true;

console.log("📋 Environment Variables:");
Object.entries(requiredVars).forEach(([key, value]) => {
   const status = value ? "✅" : "❌";
   const displayValue = value
      ? key.includes("PRIVATE_KEY")
         ? "[PRIVATE KEY SET]"
         : key.includes("VAPID")
         ? `${value.substring(0, 20)}...`
         : value.length > 30
         ? `${value.substring(0, 30)}...`
         : value
      : "NOT SET";

   console.log(`   ${status} ${key}: ${displayValue}`);

   if (!value) allValid = false;
});

console.log("\n🔧 VAPID Key Validation:");
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
if (vapidKey) {
   // VAPID keys should start with 'B' and be base64url encoded
   if (vapidKey.startsWith("B") && vapidKey.length >= 80) {
      console.log("   ✅ VAPID key format appears correct");
   } else {
      console.log("   ⚠️  VAPID key format may be incorrect");
      console.log('   💡 VAPID keys should start with "B" and be ~88 characters long');
      console.log(
         "   💡 Generate a new VAPID key in Firebase Console > Project Settings > Cloud Messaging"
      );
   }
} else {
   console.log("   ❌ VAPID key is missing");
   console.log(
      "   💡 Go to Firebase Console > Project Settings > Cloud Messaging > Web Push certificates"
   );
   console.log('   💡 Generate a new certificate and copy the "Key pair" value');
}

console.log("\n📱 Firebase Project Validation:");
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (projectId) {
   console.log(`   📋 Project ID: ${projectId}`);
   console.log("   💡 Verify this matches your Firebase console URL");
   console.log(
      `   💡 https://console.firebase.google.com/project/${projectId}/settings/cloudmessaging`
   );
} else {
   console.log("   ❌ Project ID is missing");
}

if (allValid) {
   console.log("\n🎉 All configuration appears complete!");
   console.log("\n🔧 Next steps if still having issues:");
   console.log("   1. Check Firebase Console > Project Settings > Cloud Messaging");
   console.log("   2. Ensure Cloud Messaging API is enabled");
   console.log("   3. Try generating a new VAPID key pair");
   console.log("   4. Test on HTTPS (notifications require secure context)");
} else {
   console.log(
      "\n❌ Configuration incomplete. Please add missing environment variables."
   );
}
