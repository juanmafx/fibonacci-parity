# Security Audit

**Date:** 2026-11-23. **Scope:** the working tree and the full Git history (one original commit). **Method:** manual code review, pattern-based secret scan, `npm audit`, and automated tests. This is a self-review, not an independent penetration test.

## Findings in the original script

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F-01 | Medium | Unbounded memory growth from a timer appending to an array forever | Fixed: no retained sequence state |
| F-02 | Medium | Loop of up to 100,000,000 iterations with no enforced resource limit | Fixed: closed form and explicit limits |
| F-03 | Low | Handler called `res.send` twice, which raises an error on the second call | Fixed: one response per request |
| F-04 | Low | Handler would have exposed internal state with no input or output contract | Fixed: typed JSON responses |
| F-05 | Low | `express` was required but no manifest declared or pinned it | Fixed: dependency removed |
| F-06 | Low | Silent precision loss after `F(78)` if the timer kept running | Fixed: `BigInt` arithmetic |

The original server never called `listen`, so its route was not reachable over the network.

## Categories reviewed

| Category | Result |
| --- | --- |
| Hardcoded secrets and private keys | None found in the tree or history |
| Personal data | No phone numbers or personal emails found in the source |
| SQL injection | Not applicable: the application runs no SQL |
| XSS | Responses are JSON with `nosniff` and a `default-src 'none'` CSP |
| CSRF | Not applicable: no state-changing endpoints, cookies, or sessions |
| Unsafe evaluation | No `eval`, `Function`, or shell execution in application code |
| Password hashing and 2FA | Not applicable: no accounts or credentials |
| Prototype pollution | CLI commands are resolved with `Object.hasOwn`, and unknown query keys are rejected |
| Path confusion | Request targets are length-limited and protocol-relative targets are rejected |
| Resource exhaustion | Inputs are bounded, and header and request timeouts are set |
| Dependencies | No runtime dependencies; `npm audit` reported 0 vulnerabilities on 2026-11-23 |

## Supply chain

- `fast-check` is pinned to an exact version and locked with an integrity hash.
- CI installs with lifecycle scripts disabled and uses `contents: read`.
- CI does not persist checkout credentials.
- GitHub Actions are pinned to full commit SHAs:

| Action | Version | Commit |
| --- | --- | --- |
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `actions/upload-artifact` | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |

## Residual risks

| ID | Severity | Risk | Recommended handling |
| --- | --- | --- | --- |
| R-01 | Low | No built-in rate limiting; CPU-bound requests run on the event loop | Rate-limit at a reverse proxy before public exposure |
| R-02 | Info | No TLS or authentication | Terminate TLS at the proxy; add authentication if access must be restricted |
