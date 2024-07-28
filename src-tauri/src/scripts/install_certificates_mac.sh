#!/bin/bash

# Check if the certificate file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_certificate.cer>"
    exit 1
fi

CERTIFICATE_PATH="$1"

# Import the certificate into the login keychain
echo "Importing certificate..."
security import "$CERTIFICATE_PATH" -k ~/Library/Keychains/login.keychain-db -T /usr/bin/codesign

# Check if the import was successful
if [ $? -ne 0 ]; then
    echo "Failed to import certificate."
    exit 1
fi

# Set the trust settings for the certificate
echo "Setting trust settings..."
security trust-settings-import -d ~/Library/Keychains/login.keychain-db <<EOF
{
    "Trust": {
        "Certificates": {
            "$CERTIFICATE_PATH": {
                "Trust": {
                    "Always Trust": true
                }
            }
        }
    }
}
EOF

# Verify the installation
echo "Verifying installation..."
security find-identity -p codesigning

echo "Certificate installed and trusted successfully."