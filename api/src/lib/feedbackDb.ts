import { supabase } from "./supabaseClient.js";

const TABLE = "feedback";

export async function recordFeedback(message: string, email: string): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.from(TABLE).insert({ message, email: email || null });
    if (error) console.warn("feedback insert failed", error.message);
  } catch (err) {
    console.warn("feedback insert threw", err);
  }
}
