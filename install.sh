#!/bin/bash

# Network Spy - Terminal Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.sh | sh
# Or to install specific version: curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.sh | sh -s v1.0.0
# Or to bypass quarantine (macOS/CI): curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install.sh | sh -s -- --allow-unsigned

set -e

GITHUB_REPO="muizidn/NetworkSpy-Tauri"
REPO_URL="https://github.com/$GITHUB_REPO"
API_URL="https://api.github.com/repos/$GITHUB_REPO/releases"

# Configuration
VERSION=""
ALLOW_UNSIGNED=false

# 0. Argument Parsing
for arg in "$@"; do
    if [ "$arg" = "--allow-unsigned" ]; then
        ALLOW_UNSIGNED=true
    elif [ -z "$VERSION" ]; then
        # The first non-flag argument is the version
        VERSION=$arg
    fi
done

TEMP_DIR=$(mktemp -d)

echo "🚀 Starting Network Spy Installation..."

# 1. Platform Detection
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$ARCH" = "x86_64" ]; then
    ARCH_NAME="amd64"
    ARCH_NAME_MAC="x64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    ARCH_NAME="arm64"
    ARCH_NAME_MAC="aarch64"
else
    echo "❌ Unsupported architecture: $ARCH"
    exit 1
fi

# 2. Version Detection
if [ -z "$VERSION" ] || [ "$VERSION" = "latest" ]; then
    echo "🔍 Fetching latest version info..."
    VERSION=$(curl -s -H "Cache-Control: no-cache" $API_URL/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        # Fallback if no 'latest' release exists (common for develop builds)
        VERSION=$(curl -s -H "Cache-Control: no-cache" $API_URL | grep '"tag_name":' | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')
    fi
fi

if [ -z "$VERSION" ]; then
    echo "❌ FATAL: Could not determine version to install. Please specify a version manually or ensure the repository has releases."
    exit 1
fi

echo "📦 Target Version: $VERSION"
echo "💻 Platform: $OS ($ARCH)"
if [ "$ALLOW_UNSIGNED" = true ]; then
    echo "🛡️  Bypass Mode: Enabled (Quarantine will be removed)"
fi

# 3. Download and Install
cd "$TEMP_DIR"

if [ "$OS" = "darwin" ]; then
    # macOS Installation (.dmg)
    echo "🔍 Discovering macOS assets..."
    
    # Discovery based on extension and architecture
    ASSET_DATA=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/tags/$VERSION" | grep "browser_download_url" | grep ".dmg" | grep "$ARCH_NAME_MAC" | head -n 1) || true
    
    if [ -z "$ASSET_DATA" ]; then
        # Fallback for universal or differently named builds
        ASSET_DATA=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/tags/$VERSION" | grep "browser_download_url" | grep ".dmg" | head -n 1)
    fi

    DOWNLOAD_URL=$(echo "$ASSET_DATA" | sed -E 's/.*"([^"]+)".*/\1/')
    FILENAME=$(basename "$DOWNLOAD_URL")

    if [ -z "$DOWNLOAD_URL" ]; then
        echo "❌ Could not find a suitable .dmg asset in release $VERSION."
        exit 1
    fi
    
    echo "⬇️ Downloading $FILENAME..."
    if ! curl -L -O "$DOWNLOAD_URL"; then
        echo "❌ Download failed. URL: $DOWNLOAD_URL"
        exit 1
    fi
    
    echo "💿 Mounting DMG..."
    # Robustly get the mount point using plist output
    MOUNT_POINT=$(hdiutil attach "$FILENAME" -nobrowse -plist | grep -A 1 "mount-point" | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
    
    if [ -z "$MOUNT_POINT" ]; then
        echo "❌ Failed to find mount point for $FILENAME"
        exit 1
    fi
    
    echo "📁 Installing to /Applications..."
    # Find the .app folder inside the DMG
    APP_SOURCE=$(ls -d "$MOUNT_POINT"/*.app | head -n 1)
    APP_NAME=$(basename "$APP_SOURCE")
    cp -R "$APP_SOURCE" "/Applications/"
    
    if [ "$ALLOW_UNSIGNED" = true ]; then
        echo "🛡️ Removing macOS quarantine from $APP_NAME..."
        xattr -rd com.apple.quarantine "/Applications/$APP_NAME" || echo "⚠️ Failed to remove quarantine (requires xattr/permissions)"
    fi
    
    echo "🛡️ Cleaning up..."
    hdiutil detach "$MOUNT_POINT"
    rm "$FILENAME"
    
    echo "✅ Success! Network Spy is now in your Applications folder."
    echo "💡 You can open it using: open -a '$APP_NAME'"

elif [ "$OS" = "linux" ]; then
    # Linux Installation (.deb)
    echo "🔍 Discovering Linux assets..."
    
    ASSET_DATA=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/tags/$VERSION" | grep "browser_download_url" | grep ".deb" | grep "$ARCH_NAME" | head -n 1) || true
    DOWNLOAD_URL=$(echo "$ASSET_DATA" | sed -E 's/.*"([^"]+)".*/\1/')
    FILENAME=$(basename "$DOWNLOAD_URL")

    if [ -z "$DOWNLOAD_URL" ]; then
        echo "❌ Could not find a suitable .deb asset."
        exit 1
    fi
    
    echo "⬇️ Downloading $FILENAME..."
    if ! curl -L -O "$DOWNLOAD_URL"; then
        echo "❌ Download failed. URL: $DOWNLOAD_URL"
        exit 1
    fi
    
    echo "🔐 Installing via dpkg (requires sudo)..."
    sudo dpkg -i "$FILENAME" || sudo apt-get install -f -y
    
    echo "🛡️ Cleaning up..."
    rm "$FILENAME"
    
    echo "✅ Success! Network Spy is installed."
    echo "💡 You can launch it by searching for 'Network Spy' in your applications menu."
else
    echo "❌ This installer currently supports macOS and Linux (.deb) only."
    exit 1
fi

rm -rf "$TEMP_DIR"
