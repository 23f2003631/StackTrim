import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is safe to use in the browser, but due to RLS, it cannot read/write any data
// directly unless policies are specifically created for the anon role.
// In StackTrim, all DB access flows through the server-side Service Role client.
export const createBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials are not set in the browser.");
  }
  return createClient<Database>(supabaseUrl || "", supabaseAnonKey || "");
};
