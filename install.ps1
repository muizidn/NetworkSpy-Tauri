param (
    [string]$Version = $null,
    [switch]$AllowUnsigned # Added for CI/Unsigned builds
)

$REPO = "muizidn/NetworkSpy-Tauri"

Write-Host "🚀 Starting Network Spy Installation for Windows..." -ForegroundColor Cyan

# 1. Version Detection
if ($null -eq $Version -or $Version -eq "latest") {
    Write-Host "🔍 Fetching latest version info..."
    try {
        $RELEASE_URL = "https://api.github.com/repos/$REPO/releases/latest"
        $RELEASE_INFO = Invoke-RestMethod -Uri $RELEASE_URL -Method Get
        $Version = $RELEASE_INFO.tag_name
    } catch {
        Write-Host "⚠️ Could not fetch latest release info, looking for any version..." -ForegroundColor Yellow
        try {
            $RELEASES_URL = "https://api.github.com/repos/$REPO/releases"
            $RELEASES = Invoke-RestMethod -Uri $RELEASES_URL -Method Get
            $Version = $RELEASES[0].tag_name
        } catch {
            $Version = "v0.1.0" # Hard fallback
        }
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
if ($AllowUnsigned) {
    Write-Host "🛡️  Bypass Mode: Enabled (SmartScreen bypass attempt)" -ForegroundColor Yellow
}

# 3. Download and Prepare MSI
$VERSION_NUM = $Version.TrimStart('v')
$FILENAME = "network-spy_$($VERSION_NUM)_$($MSI_ARCH)_en-US.msi"
$DOWNLOAD_URL = "https://github.com/muizidn/NetworkSpy-Tauri/releases/download/$Version/$FILENAME"

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

# 4. Silent Installation
Write-Host "💿 Installing Network Spy..." -ForegroundColor Cyan
$INSTALL_ARGS = "/i `"$TEMP_FILE`" /quiet /qn /norestart"

try {
    # Check if we need elevation if not elevated
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $INSTALL_ARGS -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Network Spy installed successfully!" -ForegroundColor Green
        Write-Host "✨ You can now find Network Spy in your Start Menu." -ForegroundColor Gray
        
        if ($AllowUnsigned) {
             # Attempt to unblock the likely installation directory
             $INSTALL_PATH = Join-Path $env:LOCALAPPDATA "Programs\network-spy"
             if (Test-Path $INSTALL_PATH) {
                 Write-Host "🛡️  Unblocking installed files in $INSTALL_PATH..." -ForegroundColor Gray
                 Get-ChildItem -Path $INSTALL_PATH -Recurse | Unblock-File
             }
        }
    } else {
        Write-Host "❌ Installation failed with exit code $($process.ExitCode)." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ An unexpected error occurred during installation." -ForegroundColor Red
}

# 5. Cleanup
if (Test-Path $TEMP_FILE) {
    Remove-Item $TEMP_FILE -Force
}
