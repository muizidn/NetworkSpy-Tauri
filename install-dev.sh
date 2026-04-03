#!/bin/bash

# Network Spy - Development Terminal Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/muizidn/NetworkSpy-Tauri/develop/install-dev.sh | sh

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
        VERSION=$arg
    fi
done

TEMP_DIR=$(mktemp -d)

echo "🚀 Starting Network Spy DEV Installation..."

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

# 2. Version Detection (Latest including pre-releases/dev builds)
if [ -z "$VERSION" ] || [ "$VERSION" = "latest" ]; then
    echo "🔍 Fetching latest development version info..."
    # We take the first release from the list, which includes pre-releases
    VERSION=$(curl -s $API_URL | grep '"tag_name":' | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/')
fi

if [ -z "$VERSION" ]; then
    echo "❌ FATAL: Could not determine version to install."
    exit 1
fi

echo "📦 Target DEV Version: $VERSION"
echo "💻 Platform: $OS ($ARCH)"
if [ "$ALLOW_UNSIGNED" = true ]; then
    echo "🛡️  Bypass Mode: Enabled"
fi

# 3. Download and Install
cd "$TEMP_DIR"

if [ "$OS" = "darwin" ]; then
    # asset name example: NetworkSpy_0.1.2-develop-build.20260403.2_aarch64.dmg
    # We need to handle BOTH naming patterns (network-spy or NetworkSpy) 
    # and version prefixes safely.
    
    # Extract version without 'v' prefix
    VER_CLEAN=${VERSION#v}
    
    # Try multiple naming patterns due to recent renaming
    FILENAMES=(
        "NetworkSpy_${VER_CLEAN}_${ARCH_NAME_MAC}.dmg"
        "network-spy_${VER_CLEAN}_${ARCH_NAME_MAC}.dmg"
    )

    SUCCESS=false
    for FILENAME in "${FILENAMES[@]}"; do
        DOWNLOAD_URL="$REPO_URL/releases/download/$VERSION/$FILENAME"
        echo "⬇️ Trying $DOWNLOAD_URL..."
        if curl -L -f -O "$DOWNLOAD_URL"; then
            SUCCESS=true
            break
        fi
    done

    if [ "$SUCCESS" = false ]; then
        echo "❌ Download failed for all known naming patterns."
        exit 1
    fi
    
    echo "💿 Mounting DMG..."
    MOUNT_POINT=$(hdiutil attach "$FILENAME" -nobrowse -plist | grep -A 1 "mount-point" | grep string | sed 's/.*<string>\(.*\)<\/string>.*/\1/')
    
    if [ -z "$MOUNT_POINT" ]; then
        echo "❌ Failed to mount $FILENAME"
        exit 1
    fi
    
    echo "📁 Installing to /Applications..."
    APP_SOURCE=$(ls -d "$MOUNT_POINT"/*.app | head -n 1)
    APP_NAME=$(basename "$APP_SOURCE")
    
    # Remove existing app to ensure clean update
    if [ -d "/Applications/$APP_NAME" ]; then
        echo "♻️  Replacing existing /Applications/$APP_NAME..."
        rm -rf "/Applications/$APP_NAME"
    fi
    
    cp -R "$APP_SOURCE" "/Applications/"
    
    if [ "$ALLOW_UNSIGNED" = true ]; then
        echo "🛡️ Removing quarantine..."
        xattr -rd com.apple.quarantine "/Applications/$APP_NAME" || true
    fi
    
    echo "🛡️ Cleaning up..."
    hdiutil detach "$MOUNT_POINT"
    rm "$FILENAME"
    
    echo "✅ Success! Network Spy DEV is ready."
    echo "💡 Open with: open -a '$APP_NAME'"

elif [ "$OS" = "linux" ]; then
    VER_CLEAN=${VERSION#v}
    
    FILENAMES=(
        "NetworkSpy_${VER_CLEAN}_${ARCH_NAME}.deb"
        "network-spy_${VER_CLEAN}_${ARCH_NAME}.deb"
    )

    SUCCESS=false
    for FILENAME in "${FILENAMES[@]}"; do
        DOWNLOAD_URL="$REPO_URL/releases/download/$VERSION/$FILENAME"
        if curl -L -f -O "$DOWNLOAD_URL"; then
            SUCCESS=true
            break
        fi
    done

    if [ "$SUCCESS" = false ]; then
        echo "❌ Download failed."
        exit 1
    fi
    
    echo "🔐 Installing via dpkg..."
    sudo dpkg -i "$FILENAME" || sudo apt-get install -f -y
    rm "$FILENAME"
    echo "✅ Success! Network Spy DEV is installed."
else
    echo "❌ Unsupported OS: $OS"
    exit 1
fi

rm -rf "$TEMP_DIR"
