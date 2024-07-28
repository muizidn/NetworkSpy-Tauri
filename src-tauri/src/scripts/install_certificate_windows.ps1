param (
    [string]$certPath
)

# Check if the certificate file is provided
if (-not $certPath) {
    Write-Host "Usage: .\install_certificate_windows.ps1 <path_to_certificate.cer>"
    exit 1
}

# Import the certificate into the Trusted Root Certification Authorities store
try {
    Write-Host "Importing certificate..."
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $cert.Import($certPath)

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()

    Write-Host "Certificate installed successfully."
} catch {
    Write-Host "Failed to import certificate: $_"
    exit 1
}

# Optionally, you can set the trust settings if needed
# In Windows, certificates added to the Trusted Root store are trusted automatically.