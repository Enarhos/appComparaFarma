const ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/**
 * Con Google OAuth, Supabase Auth acepta por defecto cualquier cuenta de
 * Google (auto-provisiona el usuario en el primer login) — sin esta lista
 * blanca, cualquiera podría entrar a /admin con su propia cuenta de Google.
 */
export function isAllowedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
