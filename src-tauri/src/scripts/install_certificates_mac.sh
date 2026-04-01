#!/bin/bash

# Check if the certificate file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_certificate.cer>"
    exit 1
fi

CERTIFICATE_PATH="$1"

# Import the certificate into the login keychain
# This does NOT require admin/sudo, but OS will still ask for "Always Trust" confirmation
echo "Importing certificate to Login Keychain..."
security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db "$CERTIFICATE_PATH"

# Check if the operation was successful
if [ $? -ne 0 ]; then
    echo "Failed to install certificate."
    exit 1
fi

echo "Certificate installed and trusted successfully in Login Keychain."