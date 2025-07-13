#!/usr/bin/env node

import { existsSync } from "fs";
import { join } from "path";

console.log("🔍 Verifying notification system file structure...\n");

const requiredFiles = [
   "src/app/test-notifications/page.tsx",
   "src/hooks/useNotifications.ts",
   "src/components/NotificationSettings.tsx",
   "services/NotificationService.ts",
   "lib/firebase.ts",
   "lib/firebase-admin.ts",
   "database/notifications-schema.sql",
];

let allFilesExist = true;

console.log("📁 Checking file structure:");
requiredFiles.forEach((file) => {
   const exists = existsSync(join(process.cwd(), file));
   console.log(`   ${exists ? "✅" : "❌"} ${file}`);
   if (!exists) allFilesExist = false;
});

console.log("\n🌐 Checking environment variables:");
const envVars = [
   "NEXT_PUBLIC_SUPABASE_URL",
   "NEXT_PUBLIC_SUPABASE_ANON_KEY",
   "NEXT_PUBLIC_FIREBASE_API_KEY",
   "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
   "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
];

envVars.forEach((envVar) => {
   const exists = !!process.env[envVar];
   console.log(`   ${exists ? "✅" : "❌"} ${envVar}`);
   if (!exists) allFilesExist = false;
});

console.log("\n📝 Checking development server:");
try {
   const response = await fetch("http://localhost:3000");
   console.log(
      `   ${response.ok ? "✅" : "❌"} Development server running on localhost:3000`
   );
} catch (error) {
   console.log("   ❌ Development server not running on localhost:3000");
   console.log("   💡 Run: npm run dev");
   allFilesExist = false;
}

if (allFilesExist) {
   console.log("\n🎉 All files and environment variables are in place!");
   console.log("💡 Try navigating to: http://localhost:3000/test-notifications");
} else {
   console.log("\n❌ Some files or environment variables are missing.");
   console.log(
      "Please ensure all required files exist and environment variables are set."
   );
}
