# Security Audit

**Date:** 2026-11-24. **Scope:** the working tree and every commit on this branch. **Method:** manual code review, `gitleaks` with redaction, `npm audit`, raw-socket probes of the HTTP server, and automated tests. This is a self-review, not an independent penetration test.

## Findings in the original script

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F-01 | Low | Unbounded but slow memory growth from a timer appending one term every 100 seconds | Fixed: no retained sequence state |
| F-02 | Info | Loop declared a bound of 100,000,000 iterations, although its exit condition always stopped it after 75 | Replaced by a closed form with explicit limits |
| F-03 | Info | Handler called `res.send` twice, which would raise an error if the route were ever served | Fixed: one response per request |
| F-04 | Info | Handler would have exposed internal state with no input or output contract | Fixed: typed JSON responses |
| F-05 | Low | `express` was required but no manifest declared or pinned it | Fixed: dependency removed |
| F-06 | Low | Silent precision loss after `F(78)` if the timer kept running | Fixed: `BigInt` arithmetic |

The original server never called `listen`, so its route was not reachable over the network.

## Findings in the rebuild, fixed before release

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| A-01 | Low | Backslash, dot-segment, encoded dot-segment, and fragment targets were normalized and then routed, which can bypass path rules in a front proxy | Fixed: a target must equal its normalized form |
| A-02 | Low | A 5-second headers timeout closed a stalled connection after about 29 seconds because of the 30-second runtime sweep | Fixed: one-second sweep |
| A-03 | Low | Bind failures crashed with an uncaught exception and stack trace | Fixed: one-line error and exit code 1 |
| A-04 | Low | A non-boolean `includeSeeds` was treated as true by the library API | Fixed: rejected with a validation error |
| A-05 | Info | CI did not run on pushes to the `dev` and `stg` branches | Fixed: both branches added |

## Categories reviewed

| Category | Result |
| --- | --- |
| Hardcoded secrets and private keys | `gitleaks` found none in the tree or in any commit |
| Personal data | No phone numbers or personal emails found in the source |
| SQL injection | Not applicable: the application runs no SQL |
| XSS | Responses are JSON with `nosniff` and a `default-src 'none'` CSP |
| CSRF | Not applicable: no state-changing endpoints, cookies, or sessions |
| Unsafe evaluation | No `eval`, `Function`, or shell execution in application code |
| Password hashing and 2FA | Not applicable: no accounts or credentials |
| Prototype pollution | CLI commands are resolved with `Object.hasOwn`, and unknown query keys are rejected |
| Path confusion | Request targets are length-limited, and targets that change under URL normalization are rejected |
| Resource exhaustion | Inputs are bounded, and header and request timeouts are enforced on a one-second sweep |
| Dependencies | No runtime dependencies; `npm audit` reported 0 vulnerabilities on 2026-11-24 |

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
| R-01 | Low on loopback, Medium if exposed | No built-in rate limiting; a maximum-size sampling request blocks the event loop for hundreds of milliseconds | Rate-limit at a reverse proxy before public exposure |
| R-02 | Info | No TLS or authentication | Terminate TLS at the proxy; add authentication if access must be restricted |
| R-03 | Info | The `Host` header is not validated, so DNS rebinding could let a web page read responses from a loopback instance; responses contain only computed public mathematics | Validate `Host` at the proxy if this matters for a deployment |
