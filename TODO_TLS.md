You are working on a Rust desktop HTTP/HTTPS proxy application built with Tauri.

The proxy currently uses the hudsucker crate for MITM interception and rustls for TLS.

Some endpoints fail with the following errors:

SignatureAlgorithmsExtensionRequired
tls handshake eof
connection error

Examples include:

* gateway.icloud.com
* [www.linkedin.com](http://www.linkedin.com)

The goal is to make the proxy TLS stack as compatible and robust as possible with modern servers.

Perform the following tasks step by step.

---

STEP 1 — Analyze Current TLS Configuration

Locate where the proxy initializes TLS:

* rustls ClientConfig
* rustls ServerConfig
* hudsucker proxy builder

Determine:

• which crypto provider is used
• whether safe defaults are enabled
• which TLS versions are supported
• whether signature algorithms extension is present

Explain findings briefly in comments.

---

STEP 2 — Enable Modern rustls Configuration

Ensure rustls uses the modern crypto provider.

Add:

rustls::crypto::ring::default_provider()
.install_default()
.expect("failed to install crypto provider");

Then ensure ClientConfig is built with:

ClientConfig::builder()
.with_safe_defaults()

Verify support for:

• TLS 1.2
• TLS 1.3
• ECDSA
• RSA-PSS
• SHA256 / SHA384

---

STEP 3 — Improve Server Name Handling

Ensure SNI is correctly passed when establishing TLS connections.

Verify the code extracts the host from CONNECT requests and passes it into:

rustls::ClientConnection

Fix any cases where SNI might be missing.

Servers like iCloud or LinkedIn require correct SNI.

---

STEP 4 — Improve Certificate Generation for MITM

Inspect the CA and leaf certificate generation.

Ensure generated certificates use:

• RSA 2048 or RSA 4096
• SHA256
• proper SAN fields
• correct key usage
• correct extended key usage

Avoid deprecated algorithms like SHA1.

---

STEP 5 — Implement Graceful TLS Interception Fallback

If TLS interception fails for any reason:

SignatureAlgorithmsExtensionRequired
tls handshake eof
invalid certificate
handshake failure

The proxy must automatically fallback to CONNECT tunnel mode.

Meaning:

Client → Proxy → Server
Encrypted tunnel without interception.

Do not terminate the request.

---

STEP 6 — Improve Logging

Add structured logging for TLS failures.

Example fields:

host
error_type
tls_version
intercept_mode

Example log:

TLS_INTERCEPT_FAILED host=gateway.icloud.com reason=SignatureAlgorithmsExtensionRequired fallback=tunnel

---

STEP 7 — Mark Non-Intercepted Traffic

When interception fails, annotate the request internally as:

tls_intercept = false

This will allow the UI to display something like:

🔒 TLS bypass (pinned or incompatible)

---

STEP 8 — Performance Safety

Ensure that TLS interception logic does not block the proxy worker threads.

Avoid unnecessary mutex locks during handshake.

---

STEP 9 — Add Test Domains

Create test cases for:

google.com
cloudflare.com
linkedin.com
apple.com

Verify that:

• interception works where possible
• tunnel fallback works where interception fails
• proxy does not crash

---

STEP 10 — Code Quality

Ensure the final code:

• compiles cleanly
• avoids unwrap() in networking paths
• uses proper error propagation
• maintains compatibility with hudsucker

Add comments explaining each improvement.

---

Goal:

Make the proxy TLS stack robust enough to handle modern HTTPS servers while gracefully degrading when interception is not possible.
