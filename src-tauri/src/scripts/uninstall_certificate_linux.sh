#!/bin/bash

set -x

echo "==== NetworkSpy Certificate Uninstallation Started ===="

CERT_NAME="NetworkSpy CA"

echo ""
echo "==== Step 1: Removing from system-wide certificates ===="

echo "Checking for certificate files..."

CERT_FOUND=0

if [ -f "/usr/local/share/ca-certificates/network-spy.crt" ]; then
    echo "Found: /usr/local/share/ca-certificates/network-spy.crt"
    echo "Removing with pkexec..."
    if pkexec rm -f /usr/local/share/ca-certificates/network-spy.crt; then
        echo "SUCCESS: Removed /usr/local/share/ca-certificates/network-spy.crt"
        CERT_FOUND=$((CERT_FOUND + 1))
    else
        echo "ERROR: Failed to remove /usr/local/share/ca-certificates/network-spy.crt"
    fi
fi

if [ -f "/usr/local/share/ca-certificates/network-spy.pem" ]; then
    echo "Found: /usr/local/share/ca-certificates/network-spy.pem"
    if pkexec rm -f /usr/local/share/ca-certificates/network-spy.pem; then
        echo "SUCCESS: Removed /usr/local/share/ca-certificates/network-spy.pem"
        CERT_FOUND=$((CERT_FOUND + 1))
    fi
fi

if [ -f "/usr/local/share/ca-certificates/NetworkSpy.crt" ]; then
    echo "Found: /usr/local/share/ca-certificates/NetworkSpy.crt"
    if pkexec rm -f /usr/local/share/ca-certificates/NetworkSpy.crt; then
        echo "SUCCESS: Removed /usr/local/share/ca-certificates/NetworkSpy.crt"
        CERT_FOUND=$((CERT_FOUND + 1))
    fi
fi

if [ $CERT_FOUND -gt 0 ]; then
    echo "Running update-ca-certificates to update system store..."
    if pkexec update-ca-certificates; then
        echo "SUCCESS: System certificate store updated"
    else
        echo "WARNING: Failed to update system certificate store"
    fi
else
    echo "No system certificate files found"
fi

echo ""
echo "==== Step 2: Removing from browser NSS stores ===="

if command -v certutil >/dev/null 2>&1; then
    echo "certutil found, will remove from browsers..."
    
    echo ""
    echo "Removing from Chrome/Chromium/Brave/Edge NSS store..."
    if [ -f "$HOME/.pki/nssdb/cert9.db" ]; then
        echo "Chrome NSS database found at: $HOME/.pki/nssdb/cert9.db"
        echo "Current certificates in store:"
        certutil -d "sql:$HOME/.pki/nssdb" -L 2>/dev/null || true
        
        echo "Deleting certificate '$CERT_NAME' from Chrome NSS store..."
        if certutil -d "sql:$HOME/.pki/nssdb" -D -n "$CERT_NAME" 2>&1; then
            echo "SUCCESS: Certificate removed from Chrome NSS store"
        else
            echo "Note: Certificate may not have been in Chrome store"
        fi
    else
        echo "Chrome NSS database not found at: $HOME/.pki/nssdb/cert9.db"
    fi
    
    echo ""
    echo "Removing from Firefox profiles..."
    echo "Looking for Firefox profiles in: $HOME/.mozilla/firefox/"
    
    PROFILE_COUNT=0
    REMOVED_COUNT=0
    
    for ff_dir in "$HOME/.mozilla/firefox"/*.*/; do
        if [ -d "$ff_dir" ]; then
            PROFILE_COUNT=$((PROFILE_COUNT + 1))
            PROFILE_NAME=$(basename "$ff_dir")
            echo "Checking Firefox profile: $PROFILE_NAME"
            
            if [ -f "$ff_dir/cert9.db" ]; then
                echo "  Profile has cert9.db (new format)"
                echo "  Current certificates:"
                certutil -d "sql:$ff_dir" -L 2>/dev/null || true
                
                echo "  Deleting certificate '$CERT_NAME'..."
                if certutil -d "sql:$ff_dir" -D -n "$CERT_NAME" 2>&1; then
                    echo "  SUCCESS: Removed from $PROFILE_NAME"
                    REMOVED_COUNT=$((REMOVED_COUNT + 1))
                fi
            elif [ -f "$ff_dir/cert8.db" ]; then
                echo "  Profile has cert8.db (old format)"
                echo "  Deleting certificate '$CERT_NAME'..."
                if certutil -d "sql:$ff_dir" -D -n "$CERT_NAME" 2>&1; then
                    echo "  SUCCESS: Removed from $PROFILE_NAME"
                    REMOVED_COUNT=$((REMOVED_COUNT + 1))
                fi
            else
                echo "  No NSS database found in this profile"
            fi
        fi
    done
    
    if [ $PROFILE_COUNT -eq 0 ]; then
        echo "No Firefox profiles found"
    else
        echo "Processed $PROFILE_COUNT Firefox profile(s), removed from $REMOVED_COUNT"
    fi
else
    echo "WARNING: certutil not found. Browser certificates NOT removed."
    echo "To fix this, install 'libnss3-tools' (Ubuntu/Debian) or 'nss-tools' (Fedora)"
fi

echo ""
echo "==== Step 3: Verification ===="
echo "Checking if certificate files still exist..."

REMAINING=0

for cert_file in \
    /usr/local/share/ca-certificates/network-spy.crt \
    /usr/local/share/ca-certificates/network-spy.pem \
    /usr/local/share/ca-certificates/NetworkSpy.crt \
    /usr/local/share/ca-certificates/NetworkSpy.pem; do
    if [ -f "$cert_file" ]; then
        echo "WARNING: Still exists: $cert_file"
        REMAINING=$((REMAINING + 1))
    fi
done

if [ $REMAINING -eq 0 ]; then
    echo "✓ No certificate files remain in system directory"
else
    echo "✗ $REMAINING certificate file(s) still exist"
fi

echo ""
echo "==== NetworkSpy Certificate Uninstallation Completed ===="
echo "Summary:"
echo "  - System certificates: $CERT_FOUND removed"
echo "  - Firefox profiles: $REMOVED_COUNT/$PROFILE_COUNT cleaned"
echo ""
echo "Note: You may need to restart your browser for changes to take effect."