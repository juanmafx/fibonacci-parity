# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 2.x | Yes |
| Earlier unversioned script | No |

## Reporting a vulnerability

Use GitHub private vulnerability reporting on this repository if it is enabled. Otherwise, open an issue asking for a private contact channel, without including exploit details. Please include the affected version and the impact.

## Security model

The service is read-only, keeps no user data, and has no accounts. It binds to loopback by default. It does not provide TLS, authentication, or rate limiting, so public deployments must place it behind a reverse proxy that does.

See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) for the audit.
