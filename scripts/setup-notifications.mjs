#!/usr/bin/env node

/**
 * Setup script for the push notification system
 * This script helps initialize the notification system with proper database schema
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Push Notification System...\n');

// Check if required files exist
const requiredFiles = [
  '.env.local',
  'database/notifications-schema.sql',
  'lib/firebase.ts',
  'lib/firebase-admin.ts',
  'services/NotificationService.ts',
];

console.log('📋 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  console.error('\nPlease ensure all notification system files are present.');
  process.exit(1);
}

console.log('✅ All required files found.\n');

// Check environment variables
console.log('🔧 Checking environment configuration...');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file found.');
  console.log('📝 Please verify your Firebase credentials are configured correctly.\n');
} else {
  console.warn('⚠️  .env.local file not found.');
  console.warn('Please copy .env.example to .env.local and configure your Firebase credentials.\n');
}

// Check if service worker exists
console.log('🔧 Checking service worker...');
const swPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
if (fs.existsSync(swPath)) {
  console.log('✅ Service worker found.\n');
} else {
  console.error('❌ Service worker not found at public/firebase-messaging-sw.js');
  process.exit(1);
}

// Check if database schema is applied
console.log('🗄️  Database setup...');
console.log('Please run the following SQL against your Supabase database:');
console.log('   psql -h your_supabase_host -U postgres -d postgres -f database/notifications-schema.sql');
console.log('Or copy the contents of database/notifications-schema.sql into your Supabase SQL editor.\n');

// Install dependencies if needed
console.log('📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'firebase',
    'firebase-admin',
    'node-cron',
    'web-push',
  ];

  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });

  if (missingDeps.length > 0) {
    console.log('Installing missing dependencies...');
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  }

  console.log('✅ All dependencies installed.\n');
} catch (error) {
  console.error('❌ Error checking dependencies:', error.message);
}

// Create necessary directories
console.log('📁 Creating directories...');
const dirs = ['config', 'logs'];
dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`   Created: ${dir}/`);
  }
});

console.log('✅ Directory structure ready.\n');

// Final setup summary
console.log('🎉 Notification System Setup Complete!\n');
console.log('Next steps:');
console.log('1. 🔑 Configure Firebase credentials in .env.local');
console.log('2. 🗄️  Apply database schema to your Supabase instance');
console.log('3. 🚀 Start your development server: npm run dev');
console.log('4. 🧪 Test notifications using the notification settings component');
console.log('\nFor detailed setup instructions, see NOTIFICATION-SYSTEM-DOCS.md');

console.log('\n📚 API Endpoints Available:');
console.log('   - POST /api/notifications/devices (register device)');
console.log('   - GET/PUT /api/notifications/preferences (manage preferences)');
console.log('   - POST /api/notifications/send (send notifications)');
console.log('   - GET /api/notifications/stats (view analytics)');

console.log('\n🎯 Ready to send notifications! 🚀');
