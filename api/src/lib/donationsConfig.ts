/**
 * Pausa temporal de donaciones Web (Production Closure, 2026-08-16).
 *
 * Decisión CTO/Product: mientras ComparaFarma opere sobre Vercel Hobby y
 * esté en su etapa inicial de adquisición de usuarios, toda monetización
 * activa permanece pausada. Las donaciones de Mobile ya estaban pausadas
 * desde 2026-08-15 (ver docs/operations/PLATFORM_OPERATIONAL_STATUS.md);
 * esta bandera extiende la misma decisión a Web, del lado del servidor
 * (barrera autoritativa — bloquea la creación de cualquier pago Khipu sin
 * importar qué caller golpee /api/donate).
 *
 * La implementación de Khipu (api/src/clients/khipu.ts,
 * createKhipuPaymentV3, tests) permanece intacta y no requiere
 * reconstruirse para reactivar — ver la bandera equivalente
 * WEB_DONATIONS_PAUSED en web/src/lib/donationsConfig.ts.
 *
 * Reactivar cambiando este valor (y el de Web) a `false` DESPUÉS de migrar
 * Vercel a un plan compatible con uso comercial (Pro) — no antes. No
 * reabrir esta decisión sin autorización explícita de Mario/ChatGPT
 * (dirección CTO/Product).
 */
export const WEB_DONATIONS_PAUSED = true;
