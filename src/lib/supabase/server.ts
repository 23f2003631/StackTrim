import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// IMPORTANT SECURITY RULE:
// This file and the createAdminClient function MUST NEVER be imported into a client component.
// It uses the SUPABASE_SERVICE_ROLE_KEY which completely bypasses Row Level Security (RLS).

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase server credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
