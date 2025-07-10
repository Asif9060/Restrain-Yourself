# Security and Session Management Documentation

## Overview

This document provides comprehensive documentation for the security implementation and session management system in the Restrain Yourself application, as implemented to fulfill the requirements in `.prompt.md`.

## Session Management Architecture

### Session Storage

-  **Storage Method**: Browser localStorage
-  **Session Duration**: 30 days (configurable)
-  **Session Keys**:
   -  `restrain_user_session`: User profile data
   -  `restrain_session_expiry`: Session expiration timestamp

### Session Lifecycle

#### 1. Session Creation

```typescript
const createSession = (userData: User) => {
   const expiryTime = Date.now() + SESSION_DURATION;
   localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
   localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
   setUser(userData);
};
```

#### 2. Session Validation

-  On app load, session is checked for existence and expiry
-  If valid, user data is verified against database
-  Session is automatically extended on successful validation
-  Invalid/expired sessions are automatically cleared

#### 3. Session Extension

```typescript
const extendSession = (userData: User) => {
   const expiryTime = Date.now() + SESSION_DURATION;
   localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
   localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
};
```

#### 4. Session Termination

```typescript
const clearSession = () => {
   localStorage.removeItem(SESSION_STORAGE_KEY);
   localStorage.removeItem(SESSION_EXPIRY_KEY);
   setUser(null);
};
```

## Security Implementation

### 1. Authentication Flow

#### User Registration

-  **No Username Uniqueness Validation**: Simplified flow removes complex validation
-  **Unique ID Generation**: Each user gets a unique ID: `user_${timestamp}_${random}`
-  **Immediate Session Creation**: User is logged in immediately after registration
-  **Profile Creation**: User profile is created in Supabase with proper isolation

#### Session Security

-  **Automatic Expiry**: Sessions expire after 30 days
-  **Database Verification**: Session validity is checked against database on app load
-  **Secure Storage**: User data is stored in localStorage (client-side only)
-  **Automatic Cleanup**: Expired or invalid sessions are automatically removed

### 2. Data Isolation

#### Row Level Security (RLS)

All database tables implement RLS policies ensuring users can only access their own data:

```sql
-- Example RLS policy for habits table
CREATE POLICY "Users can only access their own habits" ON habits
FOR ALL USING (user_id = current_user_id());
```

#### User-Specific Queries

All data queries include user ID filtering:

```typescript
const { data, error } = await supabase
   .from("habits")
   .select("*")
   .eq("user_id", user.id) // Always filter by user ID
   .eq("is_active", true);
```

### 3. Error Handling

#### Database Operations

-  All Supabase operations include comprehensive error handling
-  Errors are logged for debugging while maintaining user privacy
-  Graceful degradation for network issues

#### Session Management

-  Invalid session data is automatically cleared
-  Database connectivity issues trigger session cleanup
-  User is redirected to login on any authentication errors

### 4. Security Best Practices

#### Environment Variables

```bash
# Required Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Client Configuration

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
   auth: {
      persistSession: true, // Enable session persistence
      autoRefreshToken: true, // Automatic token refresh
   },
});
```

## API Reference

### AuthContext Methods

#### `createUser(username: string): Promise<void>`

-  Creates a new user profile and session
-  Validates username format (3-20 chars, alphanumeric + underscore/hyphen)
-  Generates unique user ID
-  Creates session with 30-day expiry

#### `signOut(): Promise<void>`

-  Clears all session data from localStorage
-  Resets user state to null
-  Redirects to username modal

#### `refreshSession(): Promise<void>`

-  Validates current session against database
-  Extends session if user still exists
-  Clears session if user not found

### Session Constants

```typescript
const SESSION_STORAGE_KEY = "restrain_user_session";
const SESSION_EXPIRY_KEY = "restrain_session_expiry";
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
```

## Testing and Verification

### Manual Testing Steps

1. **First Visit**

   -  Clear localStorage in browser
   -  Visit application
   -  Verify username modal appears
   -  Enter valid username
   -  Verify session is created and user is logged in

2. **Session Persistence**

   -  Refresh page
   -  Verify user remains logged in
   -  Close and reopen browser
   -  Verify session persists

3. **Session Expiry**

   -  Manually set expiry time in past in localStorage
   -  Refresh page
   -  Verify user is logged out and redirected to username modal

4. **Logout**
   -  Click logout button
   -  Verify session is cleared
   -  Verify redirect to username modal

### Automated Testing Considerations

```typescript
// Test session creation
describe("Session Management", () => {
   test("creates session on user registration", async () => {
      const { createUser } = useAuth();
      await createUser("testuser");

      const sessionData = localStorage.getItem("restrain_user_session");
      expect(sessionData).not.toBeNull();
   });

   test("clears session on logout", async () => {
      const { signOut } = useAuth();
      await signOut();

      const sessionData = localStorage.getItem("restrain_user_session");
      expect(sessionData).toBeNull();
   });
});
```

## Troubleshooting

### Common Issues

1. **Session Not Persisting**

   -  Check if localStorage is enabled
   -  Verify environment variables are set
   -  Check browser console for errors

2. **User Not Found Errors**

   -  Verify Supabase connection
   -  Check database permissions
   -  Ensure RLS policies are correctly configured

3. **Automatic Logout**
   -  Check session expiry time
   -  Verify database connectivity
   -  Check for Supabase credential issues

### Debug Commands

```typescript
// Check current session
console.log("Session:", localStorage.getItem("restrain_user_session"));
console.log("Expiry:", localStorage.getItem("restrain_session_expiry"));

// Check if session is expired
const expiry = localStorage.getItem("restrain_session_expiry");
const isExpired = expiry ? Date.now() > parseInt(expiry, 10) : true;
console.log("Session expired:", isExpired);
```

## Security Considerations

### Client-Side Storage

-  Session data is stored in localStorage (client-side)
-  Data is not encrypted but contains no sensitive information
-  User ID and username are the only stored identifiers
-  No passwords or tokens are stored client-side

### Database Security

-  All sensitive operations use Supabase's built-in security
-  Row Level Security ensures data isolation
-  Service role key is server-side only
-  Anonymous key has limited permissions

### Network Security

-  All communication with Supabase is over HTTPS
-  API keys are environment-specific
-  No sensitive data in client-side code

## Compliance and Privacy

### Data Handling

-  Minimal data collection (username only)
-  User-generated content is isolated per user
-  No cross-user data sharing
-  Automatic cleanup of invalid sessions

### GDPR Considerations

-  Users can delete their data by contacting admin
-  Sessions have automatic expiry
-  No tracking or analytics implemented
-  User consent implied through usage

## Future Enhancements

### Potential Security Improvements

1. **Token-Based Authentication**: Implement JWT tokens for enhanced security
2. **Session Encryption**: Encrypt localStorage data for additional protection
3. **Multi-Factor Authentication**: Add optional 2FA for enhanced security
4. **Audit Logging**: Implement comprehensive audit trails
5. **Rate Limiting**: Add rate limiting for API endpoints

### Session Management Enhancements

1. **Remember Me Option**: Allow users to choose session duration
2. **Session Analytics**: Track session usage patterns
3. **Multiple Device Support**: Sync sessions across devices
4. **Session Notifications**: Notify users of session expiry

---

**Last Updated**: July 8, 2025  
**Version**: 1.0  
**Status**: Production Ready
