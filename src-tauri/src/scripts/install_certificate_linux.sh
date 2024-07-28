#!/bin/bash

# Check if the certificate file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_certificate.cer>"
    exit 1
fi

CERTIFICATE_PATH="$1"

# Import the certificate into the trusted certificates store
echo "Importing certificate..."
sudo cp "$CERTIFICATE_PATH" /usr/local/share/ca-certificates/
sudo update-ca-certificates

# Check if the import was successful
if [ $? -ne 0 ]; then
    echo "Failed to import certificate."
    exit 1
fi

echo "Certificate installed and trusted successfully."