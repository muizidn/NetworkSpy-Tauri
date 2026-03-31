param (
    [string]$Version = $null,
    [switch]$AllowUnsigned # Added for CI/Unsigned builds
)

$REPO = "muizidn/NetworkSpy-Tauri"

Write-Host "🚀 Starting Network Spy Installation for Windows..." -ForegroundColor Cyan

# 1. Version Detection & Asset Discovery
if ([string]::IsNullOrWhiteSpace($Version) -or $Version -eq "latest") {
    Write-Host "🔍 Fetching latest version info..."
    try {
        $RELEASE_URL = "https://api.github.com/repos/$REPO/releases/latest"
        $RELEASE_INFO = Invoke-RestMethod -Uri $RELEASE_URL -Method Get -ErrorAction Stop
        $Version = $RELEASE_INFO.tag_name
    } catch {
        Write-Host "⚠️ Could not fetch latest release info, looking for any tagged version..." -ForegroundColor Yellow
        try {
            $RELEASES_URL = "https://api.github.com/repos/$REPO/releases"
            $RELEASES = Invoke-RestMethod -Uri $RELEASES_URL -Method Get -ErrorAction Stop
            if ($RELEASES.Count -gt 0) {
                $RELEASE_INFO = $RELEASES[0]
                $Version = $RELEASE_INFO.tag_name
            } else {
                Write-Host "❌ No releases found in the repository." -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Network error while fetching releases." -ForegroundColor Red
            exit 1
        }
    }
} else {
    # Manual version specified, fetch that specific release to get assets
    try {
        $RELEASE_URL = "https://api.github.com/repos/$REPO/releases/tags/$Version"
        $RELEASE_INFO = Invoke-RestMethod -Uri $RELEASE_URL -Method Get -ErrorAction Stop
    } catch {
        Write-Host "❌ Could not find release for version $Version." -ForegroundColor Red
        exit 1
    }
}

# 2. Detect Architecture
$ARCH = $env:PROCESSOR_ARCHITECTURE
$MSI_ARCH = "x64"
if ($ARCH -eq "ARM64") {
    $MSI_ARCH = "arm64"
}

Write-Host "📦 Target Version: $Version" -ForegroundColor Gray
Write-Host "💻 Platform: Windows ($MSI_ARCH)" -ForegroundColor Gray

# 3. Find Matching Asset (Robust Discovery)
# Looking for pattern: network-spy_.*_x64_en-US.msi
$ASSET_PATTERN = "network-spy_.*_$($MSI_ARCH)_en-US\.msi"
$MATCHING_ASSET = $RELEASE_INFO.assets | Where-Object { $_.name -match $ASSET_PATTERN } | Select-Object -First 1

if ($null -eq $MATCHING_ASSET) {
    Write-Host "❌ Could not find a matching MSI asset ($MSI_ARCH) in release $Version." -ForegroundColor Red
    Write-Host "Available assets: " -ForegroundColor Gray
    $RELEASE_INFO.assets.name | ForEach-Object { Write-Host " - $_" -ForegroundColor Gray }
    exit 1
}

$FILENAME = $MATCHING_ASSET.name
$DOWNLOAD_URL = $MATCHING_ASSET.browser_download_url

# 4. Download and Prepare MSI
$TEMP_FILE = Join-Path $env:TEMP $FILENAME

Write-Host "⬇️ Downloading $FILENAME..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TEMP_FILE -ErrorAction Stop
    
    if ($AllowUnsigned) {
        Write-Host "🛡️  Unblocking $FILENAME..." -ForegroundColor Gray
        Unblock-File -Path $TEMP_FILE
    }
} catch {
    Write-Host "❌ Failed to download $FILENAME. URL: $DOWNLOAD_URL" -ForegroundColor Red
    exit 1
}

# 5. Silent Installation
Write-Host "💿 Installing Network Spy..." -ForegroundColor Cyan
$INSTALL_ARGS = "/i `"$TEMP_FILE`" /quiet /qn /norestart"

try {
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $INSTALL_ARGS -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Network Spy installed successfully!" -ForegroundColor Green
        Write-Host "✨ You can now find Network Spy in your Start Menu." -ForegroundColor Gray
        
        if ($AllowUnsigned) {
             # Attempt to unblock the likely installation directory
             $INSTALL_PATH = Join-Path $env:LOCALAPPDATA "Programs\network-spy"
             if (Test-Path $INSTALL_PATH) {
                 Write-Host "🛡️  Unblocking installed files in $INSTALL_PATH..." -ForegroundColor Gray
                 Get-ChildItem -Path $INSTALL_PATH -Recurse | Unblock-File -ErrorAction SilentlyContinue
             }
        }
    } else {
        Write-Host "❌ Installation failed with exit code $($process.ExitCode)." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ An unexpected error occurred during installation." -ForegroundColor Red
}

# 6. Cleanup
if (Test-Path $TEMP_FILE) {
    Remove-Item $TEMP_FILE -Force
}
