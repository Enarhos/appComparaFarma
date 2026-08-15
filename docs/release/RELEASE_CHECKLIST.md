# Release Checklist Oficial — ComparaFarma

**Sprint:** RC-03 — Production Readiness: Observability & Operations
**Fecha:** 2026-08-06
**Uso:** ejecutar esta checklist completa antes de cada publicación (backend, web o mobile). No todas las secciones aplican a todas las publicaciones — se indica el alcance de cada una.

---

## 1. Validaciones previas (todas las publicaciones)

- [ ] `git status` limpio — sin cambios sin commitear que deban ir en el release.
- [ ] Rama actualizada contra `main` (`git pull`/`git fetch origin main`).
- [ ] `docs/product/DECISION_LOG.md` no tiene decisiones pendientes de registrar que bloqueen este release.
- [ ] Revisar `docs/operations/ENVIRONMENT.md` — confirmar que todas las variables obligatorias están configuradas en el entorno de destino (Vercel Production, no solo Preview).

## 2. Tests (backend/web)

- [ ] `cd packages/domain && npx tsc --noEmit && npx vitest run` — típicamente ejecutado vía `pnpm --filter @comparafarma/domain typecheck` / `test`.
- [ ] `cd api && npx tsc --noEmit && npx vitest run` — confirmar 182/182 (o el número vigente) en verde.
- [ ] `cd web && npx tsc --noEmit` — typecheck limpio. (La suite de tests de `web/` puede exceder el tiempo de ejecución en algunos entornos de CI/sandbox — confirmar que corrió completa en un entorno sin ese límite antes de asumir que pasó.)
- [ ] CI de GitHub Actions (`ci.yml`) en verde para el commit que se va a publicar — no confiar solo en la ejecución local.

## 3. Typecheck

- [ ] Los 3 typechecks de la sección 2 deben estar limpios (0 errores) — no "warnings aceptables", el proyecto no tiene una categoría de warning tolerado.

## 4. Build (backend/web)

- [ ] Confirmar que el build de `web/` (`pnpm --filter web build`) termina sin errores — ya cubierto por el job `web-build` de `ci.yml`, pero verificar manualmente si se está publicando fuera del flujo normal.
- [ ] `api/` no tiene un paso de "build" separado — es TypeScript ejecutado directamente por el runtime de Vercel vía el glob de `api/vercel.json`. Confirmar que ese glob sigue vigente si se agregaron archivos nuevos a `api/api/`.

## 5. Build (mobile) — solo publicaciones de `mobile/`

- [ ] **Verificar la restricción activa en `CLAUDE.md`** — mientras la app esté en Prueba Cerrada, cualquier cambio de código en `mobile/` requiere confirmación explícita antes de proceder (ver precedente RC-02).
- [ ] `versionCode` incrementado en `mobile/app.json` (`expo.android.versionCode`) y `mobile/android/app/build.gradle` (`versionCode`) — deben coincidir exactamente.
- [ ] `versionName`/`version` incrementado de forma consistente en ambos archivos.
- [ ] `npx expo-doctor` corrido en un entorno con acceso de red a `exp.host`/`api.expo.dev` (no es confiable desde un sandbox sin red) — 0 issues relevantes, o los issues conocidos documentados como aceptados.
- [ ] Confirmar permisos declarados en `mobile/android/app/src/main/AndroidManifest.xml` — solo los que tienen una librería/feature real que los justifique (ver auditoría RC-02: se eliminaron `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` por no tener uso real).
- [ ] Generar el AAB (`pnpm build:android` o `eas build --platform android --profile production`).
- [ ] Obtener la huella SHA-1/SHA-256 del `release.keystore` usado (`keytool -list -v -keystore android/app/release.keystore -storepass ... -alias ...`) y confirmarla contra "Upload key certificate" en Play Console → Configuración → Integridad de la app, **antes** de subir el AAB (ver procedimiento exacto en la auditoría RC-02 de este mismo proyecto).

## 6. Play Console — solo publicaciones de `mobile/`

- [ ] Subir el AAB al track correspondiente (Prueba Cerrada / Producción según la fase actual).
- [ ] Confirmar que el listado de la tienda (descripción, capturas, `feature-graphic.png`) sigue vigente.
- [ ] Confirmar política de privacidad accesible: `https://enarhos.github.io/appComparaFarma/privacy-policy.html`.

## 7. Data Safety — solo publicaciones de `mobile/`

- [ ] Revisar el formulario de Data Safety de Play Console contra los datos reales que la app recolecta hoy (favoritos, historial, alertas de precio con email, analítica vía PostHog/Sentry) — confirmar que no quedó desactualizado desde la última revisión.
- [ ] Confirmar declaración de permisos sensibles — no debe quedar ningún permiso sin justificación real (ver sección 5).

## 8. VersionCode / VersionName — solo publicaciones de `mobile/`

- [ ] Confirmar una última vez, después del build, que el AAB generado reporta el `versionCode`/`versionName` esperado (`bundletool dump manifest` o revisar en Play Console tras la subida) — para detectar si el script de parcheo de `build.gradle` no corrió correctamente.

## 9. Deploy API — solo publicaciones de `api/`

- [ ] Push a `main` (el deploy es automático vía `ci.yml` → job `deploy-api`).
- [ ] Confirmar que el smoke test post-deploy del propio workflow pasó (step "Smoke test deployed API", agregado en RC-03) — si falló, el job queda en rojo y no se debe considerar el release completo aunque Vercel reporte "Ready".
- [ ] Si se agregaron variables de entorno nuevas, confirmar que están configuradas en Vercel **antes** del push (un deploy que dependa de una variable nueva sin configurar puede fallar en runtime aunque el build sea exitoso).

## 10. Smoke Tests (todas las publicaciones)

- [ ] `curl https://comparafarma-api.vercel.app/api/health` → `200`, `"ok":true`, `commit` coincide con el SHA recién desplegado.
- [ ] `curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol"` → `200`, al menos 1 resultado con precios de más de una farmacia.
- [ ] `curl "https://comparafarma-api.vercel.app/api/search?q=paracetamol&debug=1"` (sin `x-api-key`) → debe responder `401` o `403`, **nunca `200`**.
- [ ] Web: abrir `https://app-compara-farma-web.vercel.app/buscar/paracetamol` manualmente y confirmar que renderiza resultados.
- [ ] Mobile (si aplica): instalar el AAB/APK de prueba en un dispositivo o emulador y confirmar que una búsqueda básica funciona de punta a punta contra la API ya desplegada.

## 11. Rollback

- [ ] Si cualquier smoke test de la sección 10 falla: seguir el procedimiento de rollback de `docs/operations/RUNBOOK.md` sección 2 antes de continuar con cualquier otro paso.
- [ ] Documentar el incidente en un postmortem (`docs/engineering/postmortems/`) si el rollback fue necesario en Producción real (no en Preview).

---

## Registro de uso

Cada vez que se ejecute esta checklist para un release real, agregar una fila abajo (fecha, versión/commit, resultado). Esto permite auditar el cumplimiento histórico del proceso.

| Fecha | Publicación | Versión/commit | Resultado |
|---|---|---|---|
| — | — | — | (sin registros todavía — este documento se creó en RC-03, 2026-08-06) |
