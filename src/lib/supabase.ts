import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug environment variables (remove in production)
if (typeof window !== 'undefined') {
   console.log('Client-side env check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseAnonKey ? 'Set' : 'Missing'
   });
}

if (!supabaseUrl || !supabaseAnonKey) {
   const errorMessage = `Missing Supabase environment variables: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`;
   console.error(errorMessage);
   throw new Error(errorMessage);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
   auth: {
      persistSession: true,
      autoRefreshToken: true,
   },
});

// Admin client for server-side operations
export const createAdminClient = (): SupabaseClient<Database> => {
   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

   if (!supabaseUrl || !serviceRoleKey) {
      const errorMessage = `Missing Supabase admin environment variables: ${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}${!serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
   }

   return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
         autoRefreshToken: false,
         persistSession: false,
      },
   });
};
