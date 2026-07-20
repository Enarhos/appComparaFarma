import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
  }
} catch (err) {
  console.error("Supabase init failed:", err);
}

export const supabase = client;
