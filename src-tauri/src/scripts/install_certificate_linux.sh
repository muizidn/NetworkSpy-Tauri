#!/bin/bash

# Check if the certificate file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_certificate.cer>"
    exit 1
fi

CERTIFICATE_PATH="$1"

# 1. Import the certificate into the trusted certificates store (System-wide)
echo "Importing certificate to system-wide store..."
# Ensure the file ends with .crt, otherwise update-ca-certificates might ignore it
pkexec cp "$CERTIFICATE_PATH" /usr/local/share/ca-certificates/network-spy.crt
pkexec update-ca-certificates

# 2. Update Linux Browser Databases (NSS Stores)
# This handles Chrome, Chromium, Brave, Microsoft Edge, and Firefox.
if command -v certutil >/dev/null 2>&1; then
    echo "Updating Chrome/Chromium trusted store..."
    mkdir -p "$HOME/.pki/nssdb"
    certutil -d "sql:$HOME/.pki/nssdb" -A -t "CT,c,c" -n "Network Spy" -i "$CERTIFICATE_PATH" 2>/dev/null || true
    
    echo "Updating Firefox trusted store profiles..."
    # Firefox can have multiple profiles, iterate and update them all.
    for ff_dir in "$HOME/.mozilla/firefox"/*.*/; do
        if [ -d "$ff_dir" ] && [ -f "$ff_dir/cert9.db" ]; then
            certutil -d "sql:$ff_dir" -A -t "CT,c,c" -n "Network Spy" -i "$CERTIFICATE_PATH" 2>/dev/null || true
        fi
    done
else
    echo "WARNING: certutil not found. System-wide trust was updated, but browsers (Chrome/Firefox) may still show 'untrusted'."
    echo "To fix this, please install 'libnss3-tools' (Ubuntu/Debian) or 'nss-tools' (Fedora) and try again."
fi

# Check if the system-wide import was successful
if [ $? -ne 0 ]; then
    echo "Failed to import certificate to system store."
    exit 1
fi

echo "Certificate installed and trusted successfully."