# 🔧 Database Setup Guide

## Problem Identified

The error `404 (Not Found)` on `/rest/v1/users` indicates that the `users` table doesn't exist in your Supabase database. We need to create the database schema.

## Step-by-Step Database Setup

### 1. Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `ynuahzvznihmnnixlrfp`

### 2. Run the Database Schema

1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql` (all 239 lines)
4. Paste it into the SQL editor
5. Click **"Run"** to execute the schema

### 3. Verify Tables Creation

After running the schema, verify these tables were created:

-  `users`
-  `habits`
-  `habit_entries`
-  `motivational_quotes`
-  `health_tips`
-  `audit_logs`

### 4. Check Row Level Security

In the Supabase dashboard:

1. Go to **"Authentication"** → **"Policies"**
2. Verify that RLS policies are created for all tables
3. All tables should show as "RLS enabled"

## Quick Test Steps

### Option 1: Via Supabase Dashboard

1. Go to **"Table Editor"** in Supabase dashboard
2. Select the `users` table
3. You should see the table structure with columns:
   -  `id` (text, primary key)
   -  `username` (text, unique)
   -  `created_at` (timestamp)
   -  `updated_at` (timestamp)
   -  `settings` (jsonb)
   -  `is_admin` (boolean)

### Option 2: Test with SQL Query

In the SQL Editor, run this test query:

```sql
SELECT COUNT(*) FROM users;
```

This should return `0` (empty table) without errors.

## Alternative: Manual Table Creation

If you prefer to create tables manually, here's the essential `users` table creation:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id = current_setting('app.current_user_id', TRUE));
```

## Troubleshooting

### If SQL Execution Fails:

1. **Permission Error**: Make sure you're the project owner
2. **Syntax Error**: Check for any copy-paste issues
3. **Extension Error**: The schema should work with default Supabase setup

### If Tables Exist But Still Get 404:

1. Check API URL in `.env.local`
2. Verify the anon key is correct
3. Test connection with:
   ```bash
   curl "https://ynuahzvznihmnnixlrfp.supabase.co/rest/v1/users?select=count" \
   -H "apikey: YOUR_ANON_KEY" \
   -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

## After Setup

Once the database is set up, the application should work correctly:

1. Username modal will appear for new users
2. User profiles will be created successfully
3. Session persistence will work as expected

## Need Help?

If you encounter issues:

1. Check the Supabase dashboard for any error messages
2. Verify your project URL and API keys
3. Test the connection in the SQL editor first
4. Check the browser console for detailed error messages
