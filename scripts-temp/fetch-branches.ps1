# fetch-branches.ps1 — genera api/src/data/branches.json desde MINSAL
# Uso: .\scripts-temp\fetch-branches.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$outDir   = Join-Path $repoRoot "api\src\data"
$outFile  = Join-Path $outDir "branches.json"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }

Write-Host "▶ Descargando sucursales desde MINSAL..."
$response = Invoke-WebRequest `
  -Uri "https://midas.minsal.cl/farmacia_v2/WS/getLocales.php" `
  -Headers @{ "User-Agent" = "Mozilla/5.0"; "Referer" = "https://midas.minsal.cl/"; "Accept" = "application/json" } `
  -UseBasicParsing
$locals = $response.Content | ConvertFrom-Json
Write-Host "  → $($locals.Count) registros obtenidos"

# Regiones por fk_region
$regionNames = @{
  "1"="Tarapacá"; "2"="Antofagasta"; "3"="Atacama"; "4"="Coquimbo";
  "5"="Valparaíso"; "6"="O'Higgins"; "7"="Maule"; "8"="Biobío";
  "9"="La Araucanía"; "10"="Los Lagos"; "11"="Aysén"; "12"="Magallanes";
  "13"="Metropolitana"; "14"="Los Ríos"; "15"="Arica y Parinacota"; "16"="Ñuble"
}

# Mapeo local_nombre → slug
$cadenaMap = @(
  @{ pattern = "cruz\s*verde";              slug = "cruz-verde"   }
  @{ pattern = "salcobrand";                slug = "salcobrand"   }
  @{ pattern = "ahumada";                   slug = "ahumada"      }
  @{ pattern = "dr\.?\s*simi|doctor\s*simi|del\s+dr"; slug = "dr-simi" }
  @{ pattern = "araucomed";                 slug = "araucomed"    }
  @{ pattern = "ecofarmacias?";             slug = "ecofarmacias" }
)

function Get-Slug($nombre) {
  if (-not $nombre) { return $null }
  foreach ($entry in $cadenaMap) {
    if ($nombre -imatch $entry.pattern) { return $entry.slug }
  }
  return $null
}

function Normalize-Text($raw) {
  $n = $raw.Trim().ToLower()
  $n = $n -replace '[áàä]','a' -replace '[éèë]','e' -replace '[íìï]','i'
  $n = $n -replace '[óòö]','o' -replace '[úùü]','u' -replace 'ñ','n'
  return $n
}

function Title-Case($str) {
  ($str.ToLower() -split '\s+' | ForEach-Object {
    if ($_.Length -gt 0) { $_.Substring(0,1).ToUpper() + $_.Substring(1) }
  }) -join ' '
}

$byCommune = @{}
$communes  = @{}

foreach ($local in $locals) {
  $slug = Get-Slug $local.local_nombre
  if (-not $slug) { continue }

  $key = Normalize-Text $local.comuna_nombre
  if (-not $key) { continue }

  if (-not $byCommune.ContainsKey($key)) { $byCommune[$key] = @() }
  if ($slug -notin $byCommune[$key])     { $byCommune[$key] += $slug }

  if (-not $communes.ContainsKey($key)) {
    $regionId   = "$($local.fk_region)"
    $regionName = if ($regionNames.ContainsKey($regionId)) { $regionNames[$regionId] } else { "Chile" }
    $communes[$key] = @{
      nombre = Title-Case $local.comuna_nombre
      region = $regionName
    }
  }
}

$result = [ordered]@{
  byCommune = $byCommune
  communes  = $communes
  fetchedAt = (Get-Date -Format "o")
}

$json = $result | ConvertTo-Json -Depth 5 -Compress
Set-Content -Path $outFile -Value $json -Encoding UTF8

Write-Host "✅ $outFile generado — $($communes.Count) comunas, $($byCommune.Count) con farmacias de cadena"
