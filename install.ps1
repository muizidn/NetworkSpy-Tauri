$REPO = "muizidn/NetworkSpy-Tauri"
$BRANCH = "develop" # Use develop for now as per install.sh logic

Write-Host "🚀 Starting Network Spy Installation for Windows..." -ForegroundColor Cyan

# 1. Fetch Latest Release Info
Write-Host "🔍 Fetching latest version info..."
try {
    $RELEASE_URL = "https://api.github.com/repos/$REPO/releases/latest"
    $RELEASE_INFO = Invoke-RestMethod -Uri $RELEASE_URL -Method Get
    $VERSION = $RELEASE_INFO.tag_name
} catch {
    # Fallback if no releases found yet or API limit hit
    Write-Host "⚠️ Could not fetch latest release, falling back to branch-based detection..." -ForegroundColor Yellow
    $VERSION = "v0.1.0"
}

# 2. Detect Architecture
$ARCH = $env:PROCESSOR_ARCHITECTURE
$MSI_ARCH = "x64"

if ($ARCH -eq "ARM64") {
    $MSI_ARCH = "arm64"
}

Write-Host "📦 Target Version: $VERSION" -ForegroundColor Gray
Write-Host "💻 Platform: Windows ($MSI_ARCH)" -ForegroundColor Gray

# 3. Download MSI
# Filename pattern: netwok-spy_0.1.0_x64_en-US.msi
$VERSION_NUM = $VERSION.TrimStart('v')
$FILENAME = "netwok-spy_$($VERSION_NUM)_$($MSI_ARCH)_en-US.msi"
$DOWNLOAD_URL = "https://github.com/muizidn/NetworkSpy-Tauri/releases/download/$VERSION/$FILENAME"

# Fallback to direct raw content if release is not yet public or in develop
# $DOWNLOAD_URL = "https://raw.githubusercontent.com/$REPO/$BRANCH/installers/$FILENAME"

$TEMP_FILE = Join-Path $env:TEMP $FILENAME

Write-Host "⬇️ Downloading $FILENAME..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $DOWNLOAD_URL -OutFile $TEMP_FILE -ErrorAction Stop
} catch {
    Write-Host "❌ Failed to download $FILENAME. Please check your internet connection or if the version $VERSION is available." -ForegroundColor Red
    exit 1
}

# 4. Silent Installation
Write-Host "💿 Installing Network Spy..." -ForegroundColor Cyan
$INSTALL_ARGS = "/i `"$TEMP_FILE`" /quiet /qn /norestart"

try {
    $process = Start-Process -FilePath "msiexec.exe" -ArgumentList $INSTALL_ARGS -Wait -PassThru
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Network Spy installed successfully!" -ForegroundColor Green
        Write-Host "✨ You can now find Network Spy in your Start Menu." -ForegroundColor Gray
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
