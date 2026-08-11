# Session cookies and tokens

The browser receives a random session token in an `HttpOnly` cookie. The server
stores only a SHA-256 digest of that token, so a database read does not directly
produce a usable cookie. Sessions expire after 30 days and logout records a
revocation timestamp.

Passwords use PBKDF2-HMAC-SHA256 with 100,000 iterations because Cloudflare
Workers rejects higher PBKDF2 iteration counts. The work factor is a deployment
compatibility constraint and should be revisited if the runtime supports a higher
bound or a memory-hard algorithm becomes practical across both runtimes.

The cookie is preferable here to a token in local storage because the browser
sends it automatically to the same origin while JavaScript cannot read it.
`SameSite=Lax` and `Secure` in production provide additional browser protections.
