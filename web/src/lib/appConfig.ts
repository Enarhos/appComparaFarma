import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "app_config";

export async function getConfigValue<T>(key: string): Promise<T | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.from(TABLE).select("value").eq("key", key).maybeSingle();
  if (error || !data) return null;
  return data.value as T;
}

export async function setConfigValue(key: string, value: unknown): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  if (!admin) return { error: "Supabase no configurado en este proyecto de Vercel." };

  const { error } = await admin.from(TABLE).upsert({ key, value, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}
