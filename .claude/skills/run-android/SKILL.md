---
description: Launch ComparaFarma on Android emulator (AVD: Medium_Phone_API_36.1)
---

# Run ComparaFarma on Android Emulator

## Prerequisites
- Android Studio installed at default path
- AVD `Medium_Phone_API_36.1` exists
- App package: `mla.app.comparafarma`

## CRITICAL: Metro MUST run from PowerShell (not Bash)
Metro started from Bash/WSL injects CRLF in HTTP chunked responses, causing
`java.net.ProtocolException: Expected leading [0-9a-fA-F] character but was 0xd`
in the Expo dev client. Always use PowerShell or CMD.

## Launch sequence

### Step 1 — Start emulator (if not running)
```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1 -no-snapshot-save &
# Wait for boot
do { Start-Sleep 5; $s = & $adb shell getprop sys.boot_completed 2>&1 } while ($s -notmatch "^1")
Write-Host "Emulator ready"
```

### Step 2 — Run pnpm android (builds + starts Metro + installs APK + launches app)
```powershell
Set-Location C:\Belford\appComparaFarma
$env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"
pnpm android
```
This is the only reliable method. It starts Metro correctly and auto-launches the app.
Gradle uses cache so subsequent runs take ~30s.

### Step 3 — Set adb reverse (if needed for separate Metro)
```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb reverse tcp:8081 tcp:8081
```

## Taking screenshots
```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb shell screencap /sdcard/screen.png
& $adb pull /sdcard/screen.png "$env:TEMP\screen.png"
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("$env:TEMP\screen.png")
$t = $img.GetThumbnailImage(540, 1200, $null, [IntPtr]::Zero)
$t.Save("$env:TEMP\screen_thumb.png"); $img.Dispose(); $t.Dispose()
# Then: Read "$env:TEMP\screen_thumb.png"
```

## Tapping UI elements
Always use `uiautomator dump` to get exact bounds before tapping:
```powershell
& $adb shell uiautomator dump /sdcard/ui.xml
& $adb pull /sdcard/ui.xml "$env:TEMP\ui.xml"
$c = Get-Content "$env:TEMP\ui.xml" -Raw
[regex]::Matches($c, 'text="([^"]+)"[^>]*bounds="(\[[^\]]+\]\[[^\]]+\])"') |
  ForEach-Object { "$($_.Groups[2].Value)  $($_.Groups[1].Value)" }
# Tap at center of bounds [x1,y1][x2,y2]: tap ((x1+x2)/2, (y1+y2)/2)
& $adb shell input tap 540 1083
```

## Opening the FilterSheet (for testing filter changes)
1. App loads to Home — tap filter chip at ~y=520
2. FilterSheet opens — test location/pharmacy/sort sections
3. With a commune selected (e.g. Ancud), unavailable pharmacies collapse to "N sin sucursal en X ›"

## Known issues
- `10.0.2.2:8081` connection fails if Windows Firewall blocks it — use `localhost:8081` with adb reverse instead
- Emulator snapshot may restore old APK — run `adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk` after snapshot restore
- Metro from Bash has CRLF issues — always PowerShell
