# Captures one app window (Roblox Studio or Blender) even when it is covered, scales it down and writes
#   <OutDir>\<App>.jpg   the frame, to look at or attach to a thread
#   <OutDir>\<App>.json  {image, app, title, caption, at}: the HQ `live/<App>` row, sent with
#                        ArtifactData update + file_path so the image bytes never enter Claude's context
# PrintWindow with PW_RENDERFULLCONTENT is used because CopyFromScreen returns black or the window on top
# for GPU-drawn viewports. Usage: pwsh ~/.claude/claude-setup/live-shot.ps1 -App studio -Caption "Zaun gebaut"
param(
  [ValidateSet('studio', 'blender')][string]$App = 'studio',
  [string]$Caption = '',
  [string]$Link = '',     # the thread's https link, shown as "Thread öffnen" in HQ
  [string]$OutDir = (Join-Path $env:LOCALAPPDATA 'claude-live'),
  [int]$MaxWidth = 960,   # HQ shows a card, not a monitor; 960 px JPEG stays near 100 KB
  [int]$Quality = 70
)
$ErrorActionPreference = 'Stop'
$processNames = @{ studio = 'RobloxStudioBeta'; blender = 'blender' }

Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public static class LiveWin {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr dc, uint flags);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@

$process = Get-Process -Name $processNames[$App] -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $process) { throw "$App is not open (no $($processNames[$App]) window)" }
# Without DPI awareness GetWindowRect returns scaled coordinates and the right edge gets cut off
[void][LiveWin]::SetProcessDPIAware()
$handle = $process.MainWindowHandle
if ([LiveWin]::IsIconic($handle)) { throw "$App is minimised; restore the window so it can be captured" }

$rect = New-Object LiveWin+RECT
[void][LiveWin]::GetWindowRect($handle, [ref]$rect)
$width = $rect.R - $rect.L; $height = $rect.B - $rect.T
$full = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($full)
$dc = $graphics.GetHdc()
[void][LiveWin]::PrintWindow($handle, $dc, 2)  # 2 = PW_RENDERFULLCONTENT
$graphics.ReleaseHdc($dc); $graphics.Dispose()

$scale = [Math]::Min(1.0, [double]$MaxWidth / $width)
$small = New-Object System.Drawing.Bitmap ([int]($width * $scale)), ([int]($height * $scale))
$resize = [System.Drawing.Graphics]::FromImage($small)
$resize.InterpolationMode = 'HighQualityBicubic'
$resize.DrawImage($full, 0, 0, $small.Width, $small.Height)
$resize.Dispose(); $full.Dispose()

New-Item -ItemType Directory -Force $OutDir | Out-Null
$jpgPath = Join-Path $OutDir "$App.jpg"
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
$small.Save($jpgPath, $codec, $params); $small.Dispose()

$row = [ordered]@{
  image   = 'data:image/jpeg;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($jpgPath))
  app     = $App
  title   = $process.MainWindowTitle -replace '[A-Za-z]:\\(?:[^\\\[\]]*\\)*', ''  # Blender shows the .blend path; keep only the file name
  caption = $Caption
  link    = $Link
  at      = (Get-Date).ToUniversalTime().ToString('o')
}
$jsonPath = Join-Path $OutDir "$App.json"
$row | ConvertTo-Json -Compress | Set-Content -Encoding utf8NoBOM $jsonPath
Write-Output "$jpgPath ($([Math]::Round((Get-Item $jpgPath).Length / 1KB)) KB)"
