import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
   throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
   auth: {
      persistSession: true,
      autoRefreshToken: true,
   },
});

// Admin client for server-side operations
export const createAdminClient = (): SupabaseClient<Database> => {
   const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

   if (!serviceRoleKey) {
      throw new Error("Missing Supabase service role key");
   }

   return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
         autoRefreshToken: false,
         persistSession: false,
      },
   });
};
