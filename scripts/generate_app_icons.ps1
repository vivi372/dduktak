Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourcePath = Join-Path $scriptDir "..\frontend\src\assets\app-icon-source.png"
$resBase = Join-Path $scriptDir "..\frontend\android\app\src\main\res"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source image not found: $sourcePath"
    exit 1
}

$source = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$DestinationPath,
        [bool]$IsRound = $false,
        [bool]$IsForeground = $false
    )

    $destBitmap = New-Object System.Drawing.Bitmap($Width, $Height)
    $destBitmap.SetResolution($Image.HorizontalResolution, $Image.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)

    if ($IsForeground) {
        # Adaptive Icon Foreground: 108dp 캔버스 내 72dp 핵심 영역에 중앙 배치
        $innerW = [int]($Width * 0.72)
        $innerH = [int]($Height * 0.72)
        $offsetX = [int](($Width - $innerW) / 2)
        $offsetY = [int](($Height - $innerH) / 2)
        $graphics.DrawImage($Image, $offsetX, $offsetY, $innerW, $innerH)
    } elseif ($IsRound) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $Width, $Height)
        $graphics.SetClip($path)
        $graphics.DrawImage($Image, 0, 0, $Width, $Height)
        $path.Dispose()
    } else {
        $graphics.DrawImage($Image, 0, 0, $Width, $Height)
    }

    $destBitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $destBitmap.Dispose()
    Write-Output "Generated: $DestinationPath ($Width x $Height)"
}

$densities = @(
    @{ Name = "mdpi"; Launcher = 48; Foreground = 108 },
    @{ Name = "hdpi"; Launcher = 72; Foreground = 162 },
    @{ Name = "xhdpi"; Launcher = 96; Foreground = 216 },
    @{ Name = "xxhdpi"; Launcher = 144; Foreground = 324 },
    @{ Name = "xxxhdpi"; Launcher = 192; Foreground = 432 }
)

foreach ($d in $densities) {
    $dir = Join-Path $resBase ("mipmap-" + $d.Name)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $launcherPath = Join-Path $dir "ic_launcher.png"
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    $foregroundPath = Join-Path $dir "ic_launcher_foreground.png"

    Resize-Image -Image $source -Width $d.Launcher -Height $d.Launcher -DestinationPath $launcherPath -IsRound $false
    Resize-Image -Image $source -Width $d.Launcher -Height $d.Launcher -DestinationPath $roundPath -IsRound $true
    Resize-Image -Image $source -Width $d.Foreground -Height $d.Foreground -DestinationPath $foregroundPath -IsForeground $true
}

$source.Dispose()
Write-Output "SUCCESS: Android app icons updated from '오늘의 뚝딱 로고.png'!"
