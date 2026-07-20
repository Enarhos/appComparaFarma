import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "feedback";

export interface FeedbackRow {
  id: number;
  message: string;
  email: string | null;
  status: string;
  created_at: string;
}

export type FeedbackResult = { ok: true; rows: FeedbackRow[] } | { ok: false; error: string };

export async function getFeedback(): Promise<FeedbackResult> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Faltan SUPABASE_URL / SUPABASE_SECRET_KEY en este proyecto de Vercel." };
  }

  const { data, error } = await admin
    .from(TABLE)
    .select("id, message, email, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: (data ?? []) as FeedbackRow[] };
}

export async function setFeedbackStatus(id: number, status: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from(TABLE).update({ status }).eq("id", id);
}
