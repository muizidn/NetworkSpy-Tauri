#!/bin/bash

CERT_NAME="NetworkSpy"

echo "Starting certificate uninstallation..."

# 1. Remove from system-wide trusted certificates
echo "Removing from system-wide certificates..."
if [ -f "/usr/local/share/ca-certificates/network-spy.crt" ]; then
    pkexec rm -f /usr/local/share/ca-certificates/network-spy.crt
    echo "Removed /usr/local/share/ca-certificates/network-spy.crt"
fi

if [ -f "/usr/local/share/ca-certificates/NetworkSpy.crt" ]; then
    pkexec rm -f /usr/local/share/ca-certificates/NetworkSpy.crt
    echo "Removed /usr/local/share/ca-certificates/NetworkSpy.crt"
fi

# Update ca-certificates
echo "Updating certificate store..."
pkexec update-ca-certificates

# 2. Remove from Chrome/Chromium/Brave NSS store
echo "Removing from Chrome/Chromium trusted store..."
if command -v certutil >/dev/null 2>&1; then
    # Remove from user's NSS database
    if [ -f "$HOME/.pki/nssdb/cert9.db" ]; then
        certutil -d "sql:$HOME/.pki/nssdb" -D -n "$CERT_NAME" 2>/dev/null || true
        echo "Removed from Chrome NSS store"
    fi
    
    # Remove from Firefox profiles
    echo "Removing from Firefox trusted store profiles..."
    for ff_dir in "$HOME/.mozilla/firefox"/*.*/; do
        if [ -d "$ff_dir" ] && [ -f "$ff_dir/cert9.db" ]; then
            certutil -d "sql:$ff_dir" -D -n "$CERT_NAME" 2>/dev/null || true
            echo "Removed from Firefox profile: $(basename "$ff_dir")"
        fi
    done
    
    # Also check for older Firefox format (cert8.db)
    for ff_dir in "$HOME/.mozilla/firefox"/*.*/; do
        if [ -d "$ff_dir" ] && [ -f "$ff_dir/cert8.db" ]; then
            certutil -d "sql:$ff_dir" -D -n "$CERT_NAME" 2>/dev/null || true
        fi
    done
else
    echo "WARNING: certutil not found. Browser certificates may not be fully removed."
    echo "To fix this, please install 'libnss3-tools' (Ubuntu/Debian) or 'nss-tools' (Fedora)."
fi

echo "Certificate uninstallation completed."