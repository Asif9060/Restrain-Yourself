#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

console.log("🔧 Updating Firebase service worker configuration...\n");

const serviceWorkerPath = "public/firebase-messaging-sw.js";

try {
   // Read the service worker file
   let serviceWorkerContent = readFileSync(serviceWorkerPath, "utf8");

   // Extract Firebase config from environment variables
   const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
   };

   // Check if all required environment variables are present
   const missingVars = Object.entries(firebaseConfig)
      .filter(([, value]) => !value)
      .map(([key]) => key);

   if (missingVars.length > 0) {
      console.log("❌ Missing Firebase environment variables:");
      missingVars.forEach((varName) => {
         const envVarName = `NEXT_PUBLIC_FIREBASE_${varName
            .replace(/([A-Z])/g, "_$1")
            .toUpperCase()}`;
         console.log(`   - ${envVarName}`);
      });
      console.log("\nPlease add these variables to your .env.local file.");
      process.exit(1);
   }

   // Replace placeholder config with actual config
   const configString = JSON.stringify(firebaseConfig, null, 2);

   // Replace the placeholder configuration
   serviceWorkerContent = serviceWorkerContent.replace(
      /const firebaseConfig = {[\s\S]*?};/,
      `const firebaseConfig = ${configString};`
   );

   // Write the updated service worker
   writeFileSync(serviceWorkerPath, serviceWorkerContent);

   console.log("✅ Service worker configuration updated successfully!");
   console.log("📋 Configuration applied:");
   console.log(`   - Project ID: ${firebaseConfig.projectId}`);
   console.log(`   - Auth Domain: ${firebaseConfig.authDomain}`);
   console.log(`   - Messaging Sender ID: ${firebaseConfig.messagingSenderId}`);
   console.log("\n🚀 Your notification system is now ready to use!");
} catch (error) {
   console.error("❌ Failed to update service worker:", error.message);
   process.exit(1);
}
