param (
    [string]$certPath
)

# Check if the certificate file is provided
if (-not $certPath) {
    Write-Host "Usage: .\install_certificate_windows.ps1 <path_to_certificate.cer>"
    exit 1
}

# Import the certificate into the CurrentUser Root store
# This does NOT require administrative privileges
try {
    Write-Host "Importing certificate to CurrentUser store..."
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $cert.Import($certPath)

    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()

    Write-Host "Certificate installed successfully for current user."
} catch {
    Write-Host "Failed to import certificate: $_"
    exit 1
}

# Optionally, you can set the trust settings if needed
# In Windows, certificates added to the Trusted Root store are trusted automatically.