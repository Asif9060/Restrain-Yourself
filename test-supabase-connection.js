// Quick Supabase connection test
// Run this in your browser console on localhost:3000 to test the connection

(async function testSupabaseConnection() {
   const supabaseUrl = "https://ynuahzvznihmnnixlrfp.supabase.co";
   const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludWFoenZ6bmlobW5uaXhscmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDkxNzUsImV4cCI6MjA2NzQ4NTE3NX0.5-UhUK_nyPKO7-7PH0ao9iT9ete8vrMtxoQX-svSA3M";

   console.log("Testing Supabase connection...");

   try {
      // Test if we can reach the API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
         headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
         },
      });

      console.log("API Response Status:", response.status);

      if (response.status === 200) {
         console.log("✅ Supabase API is reachable");

         // Test users table specifically
         const usersResponse = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
            headers: {
               apikey: supabaseKey,
               Authorization: `Bearer ${supabaseKey}`,
            },
         });

         console.log("Users table response:", usersResponse.status);

         if (usersResponse.status === 200) {
            console.log("✅ Users table exists and is accessible");
         } else if (usersResponse.status === 404) {
            console.log("❌ Users table does not exist - run the database schema");
         } else {
            console.log("⚠️ Users table access issue:", usersResponse.status);
         }
      } else {
         console.log("❌ Supabase API not reachable");
      }
   } catch (error) {
      console.error("Connection test failed:", error);
   }
})();
