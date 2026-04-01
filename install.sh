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
    VERSION=$(curl -s $API_URL/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    if [ -z "$VERSION" ]; then
        # Fallback if no 'latest' release exists (common for develop builds)
        VERSION=$(curl -s $API_URL | grep '"tag_name":' | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')
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
    # Asset naming pattern: network-spy_0.1.0_x64.dmg 
    FILENAME="network-spy_${VERSION#v}_${ARCH_NAME_MAC}.dmg"
    DOWNLOAD_URL="$REPO_URL/releases/download/$VERSION/$FILENAME"
    
    echo "⬇️ Downloading $FILENAME..."
    if ! curl -L -O "$DOWNLOAD_URL"; then
        echo "❌ Download failed. Is the version/platform correct? URL: $DOWNLOAD_URL"
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
    echo "💡 You can open it using: open -a 'Network Spy'"

elif [ "$OS" = "linux" ]; then
    # Linux Installation (.deb)
    FILENAME="network-spy_${VERSION#v}_${ARCH_NAME}.deb"
    DOWNLOAD_URL="$REPO_URL/releases/download/$VERSION/$FILENAME"
    
    echo "⬇️ Downloading $FILENAME..."
    if ! curl -L -O "$DOWNLOAD_URL"; then
        echo "❌ Download failed. Is the version/platform correct? URL: $DOWNLOAD_URL"
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
