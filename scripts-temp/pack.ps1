# pack.ps1 — Genera ZIP del proyecto con exactamente los archivos que están en GitHub.
# Usa `git archive` internamente, así no hay riesgo de incluir node_modules,
# .gradle, build/, APKs, keystores ni nada ignorado por .gitignore.
#
# Uso:
#   pwsh scripts-temp/pack.ps1
#   pwsh scripts-temp/pack.ps1 -OutputDir "C:\Users\Belford\Desktop"
#   pwsh scripts-temp/pack.ps1 -Ref "HEAD~1"   # versión anterior

param(
    [string]$OutputDir = "$PSScriptRoot\..",   # raíz del repo por defecto
    [string]$Ref       = "HEAD"                # rama o commit a empaquetar
)

Set-Location "$PSScriptRoot\.."

# ── Leer versión desde mobile/app.json ──────────────────────────────────────
$appJson  = Get-Content "mobile/app.json" -Raw | ConvertFrom-Json
$version  = $appJson.expo.version
$vcRaw    = $appJson.expo.android.versionCode
$vc       = if ($vcRaw) { "vc$vcRaw" } else { "" }

# ── Nombre del archivo ───────────────────────────────────────────────────────
$date     = Get-Date -Format "yyyyMMdd"
$fileName = "comparafarma-src-v$version-$vc-$date.zip"
$outPath  = Join-Path (Resolve-Path $OutputDir) $fileName

# ── Generar ZIP con git archive ──────────────────────────────────────────────
Write-Host ""
Write-Host "Empaquetando ref: $Ref"
Write-Host "Destino:          $outPath"
Write-Host ""

git archive --format=zip --output="$outPath" $Ref

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git archive falló (código $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

# ── Reporte ──────────────────────────────────────────────────────────────────
$sizeMB = [math]::Round((Get-Item $outPath).Length / 1MB, 2)
Write-Host "Listo." -ForegroundColor Green
Write-Host "Archivo:  $outPath"
Write-Host "Tamaño:   $sizeMB MB"
Write-Host ""

# Listar los 10 archivos más grandes del ZIP para referencia
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($outPath)
$entries = $zip.Entries | Sort-Object Length -Descending | Select-Object -First 10
Write-Host "Top 10 archivos más grandes:"
$entries | ForEach-Object {
    $kb = [math]::Round($_.Length / 1KB, 1)
    Write-Host ("  {0,7} KB  {1}" -f $kb, $_.FullName)
}
$zip.Dispose()

Write-Host ""
Write-Host "Total de archivos: $(([System.IO.Compression.ZipFile]::OpenRead($outPath)).Entries.Count)"
