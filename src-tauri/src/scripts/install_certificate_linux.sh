#!/bin/bash

echo "==== NetworkSpy Certificate Installation Started ===="

# Use CERTIFICATE_PATH from environment if available, otherwise use $1
if [ -n "$CERTIFICATE_PATH" ]; then
    echo "Using certificate path from environment: $CERTIFICATE_PATH"
elif [ "$#" -ge 1 ]; then
    CERTIFICATE_PATH="$1"
    echo "Using certificate path from argument: $CERTIFICATE_PATH"
else
    echo "ERROR: No certificate path provided. Set CERTIFICATE_PATH env var or pass as argument."
    exit 1
fi

if [ ! -f "$CERTIFICATE_PATH" ]; then
    echo "ERROR: Certificate file not found: $CERTIFICATE_PATH"
    exit 1
fi

echo ""
echo "==== Step 1: System-wide certificate installation ===="
echo "Target directory: /usr/local/share/ca-certificates/"
echo "Copying certificate with pkexec (requires admin)..."

if pkexec cp "$CERTIFICATE_PATH" /usr/local/share/ca-certificates/network-spy.crt; then
    echo "SUCCESS: Certificate copied to /usr/local/share/ca-certificates/network-spy.crt"
else
    echo "ERROR: Failed to copy certificate to system directory"
    exit 1
fi

echo "Running update-ca-certificates to update system certificate store..."
if pkexec update-ca-certificates; then
    echo "SUCCESS: System certificate store updated"
else
    echo "ERROR: Failed to update system certificate store"
    exit 1
fi

echo "Verifying certificate was added..."
ls -la /usr/local/share/ca-certificates/network-spy.crt 2>/dev/null || echo "Warning: Certificate file not found after install"

echo ""
echo "==== Step 2: Browser certificate installation (NSS) ===="

if command -v certutil >/dev/null 2>&1; then
    echo "certutil found, will install to browsers..."
    
    echo "Creating Chrome/Chromium NSS database directory..."
    mkdir -p "$HOME/.pki/nssdb"
    ls -la "$HOME/.pki/nssdb/"
    
    echo "Installing certificate to Chrome/Chromium/Brave/Edge NSS store..."
    echo "Database path: sql:$HOME/.pki/nssdb"
    echo "Certificate name: NetworkSpy CA"
    echo "Trust flags: CT,c,c (Trusted TLS server CA)"
    
    if certutil -d "sql:$HOME/.pki/nssdb" -A -t "CT,c,c" -n "NetworkSpy CA" -i "$CERTIFICATE_PATH" 2>&1; then
        echo "SUCCESS: Certificate added to Chrome/Chromium NSS store"
    else
        echo "WARNING: Failed to add certificate to Chrome/Chromium NSS store"
    fi
    
    echo "Verifying Chrome NSS store..."
    certutil -d "sql:$HOME/.pki/nssdb" -L 2>/dev/null | grep -i "networkspy" || echo "Note: Certificate may not appear in list (this is normal for some systems)"
    
    echo ""
    echo "Installing certificate to Firefox profiles..."
    echo "Looking for Firefox profiles in: $HOME/.mozilla/firefox/"
    
    PROFILE_COUNT=0
    for ff_dir in "$HOME/.mozilla/firefox"/*.*/; do
        if [ -d "$ff_dir" ]; then
            PROFILE_COUNT=$((PROFILE_COUNT + 1))
            PROFILE_NAME=$(basename "$ff_dir")
            echo "Found Firefox profile: $PROFILE_NAME"
            echo "Profile path: $ff_dir"
            
            if [ -f "$ff_dir/cert9.db" ]; then
                echo "Profile has cert9.db (new format), installing..."
                if certutil -d "sql:$ff_dir" -A -t "CT,c,c" -n "NetworkSpy CA" -i "$CERTIFICATE_PATH" 2>&1; then
                    echo "SUCCESS: Certificate added to Firefox profile $PROFILE_NAME"
                else
                    echo "WARNING: Failed to add certificate to Firefox profile $PROFILE_NAME"
                fi
            elif [ -f "$ff_dir/cert8.db" ]; then
                echo "Profile has cert8.db (old format), installing..."
                if certutil -d "sql:$ff_dir" -A -t "CT,c,c" -n "NetworkSpy CA" -i "$CERTIFICATE_PATH" 2>&1; then
                    echo "SUCCESS: Certificate added to Firefox profile $PROFILE_NAME"
                else
                    echo "WARNING: Failed to add certificate to Firefox profile $PROFILE_NAME"
                fi
            else
                echo "No NSS database found in profile, skipping..."
            fi
        fi
    done
    
    if [ $PROFILE_COUNT -eq 0 ]; then
        echo "No Firefox profiles found in $HOME/.mozilla/firefox/"
    else
        echo "Processed $PROFILE_COUNT Firefox profile(s)"
    fi
else
    echo "WARNING: certutil not found. Browser certificates will NOT be installed."
    echo "To fix this, install 'libnss3-tools' (Ubuntu/Debian) or 'nss-tools' (Fedora)"
fi

echo ""
echo "==== Step 3: Verification ===="
echo "Checking system certificate store..."
if [ -f "/usr/local/share/ca-certificates/network-spy.crt" ]; then
    echo "✓ Certificate file exists at /usr/local/share/ca-certificates/network-spy.crt"
    ls -la /usr/local/share/ca-certificates/network-spy.crt
else
    echo "✗ Certificate file NOT found"
fi

echo ""
echo "==== NetworkSpy Certificate Installation Completed ===="
echo "Summary:"
echo "  - System-wide: $([ -f /usr/local/share/ca-certificates/network-spy.crt ] && echo 'INSTALLED' || echo 'FAILED')"
echo "  - Chrome/Chromium: $([ -f "$HOME/.pki/nssdb/cert9.db" ] && echo 'ATTEMPTED' || echo 'NOT AVAILABLE')"
echo "  - Firefox: $PROFILE_COUNT profile(s) processed"
echo ""
echo "You may need to restart your browser for the changes to take effect."