# build-android-release.ps1
# Genera el AAB de producción para Google Play sin necesitar EAS cloud.
#
# Uso:
#   cd <repo-root>
#   .\scripts-temp\build-android-release.ps1
#
# Requisitos:
#   - Android Studio instalado (provee Java JBR)
#   - ANDROID_HOME configurado o SDK en AppData\Local\Android\Sdk

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot  = (Resolve-Path "$PSScriptRoot\..").Path
$mobileDir = Join-Path $repoRoot "mobile"
$androidDir = Join-Path $mobileDir "android"
$aabOut    = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"

# ── 1. Leer version y versionCode de app.json ──────────────────────────────
$appJson = Get-Content (Join-Path $mobileDir "app.json") | ConvertFrom-Json
$version     = $appJson.expo.version
$versionCode = $appJson.expo.android.versionCode
Write-Host "▶ Versión: $version (code $versionCode)"

# ── 2. Parchear build.gradle con los valores correctos ─────────────────────
$buildGradle = Join-Path $androidDir "app\build.gradle"
if (-not (Test-Path $buildGradle)) {
  Write-Error "build.gradle no encontrado. Ejecuta 'npx expo prebuild --platform android' primero."
}
$content = Get-Content $buildGradle -Raw
$content = $content -replace 'versionCode\s+\d+',     "versionCode $versionCode"
$content = $content -replace 'versionName\s+"[^"]+"', "versionName `"$version`""
Set-Content $buildGradle $content -NoNewline
Write-Host "▶ build.gradle actualizado → versionCode $versionCode, versionName $version"

# ── 3. Configurar entorno ───────────────────────────────────────────────────
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:NODE_ENV = "production"
$env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"   # Crítico para monorepo pnpm

Write-Host "▶ JAVA_HOME:    $env:JAVA_HOME"
Write-Host "▶ ANDROID_HOME: $env:ANDROID_HOME"

# ── 4. Gradle bundleRelease ─────────────────────────────────────────────────
Write-Host "▶ Iniciando Gradle bundleRelease..."
Set-Location $androidDir
& ".\gradlew.bat" bundleRelease
if ($LASTEXITCODE -ne 0) { Write-Error "Gradle build falló." }

# ── 5. Resultado ─────────────────────────────────────────────────────────────
$info = Get-Item $aabOut
Write-Host ""
Write-Host "✅ AAB listo:"
Write-Host "   $($info.FullName)"
Write-Host "   $([math]::Round($info.Length/1MB,1)) MB — $($info.LastWriteTime)"
Write-Host ""
Write-Host "Próximo paso: subir a Google Play Console → Producción → Crear nueva versión"
