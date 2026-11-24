# Changelog

This project follows [Semantic Versioning](https://semver.org/) and the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [2.0.0] - Unreleased

The original script had no version number. It is treated as the implicit 1.x line.

### Added

- Exact Fibonacci evaluation with fast doubling, plus modular evaluation.
- Closed-form parity results and k-th odd term search.
- Pisano period computation.
- Seeded parity sampling with Wilson score intervals.
- JSON CLI and read-only HTTP API.
- Unit, property-based, statistical, and integration tests, with a committed test report.
- Optional SQLite schema, architecture documentation, security policy, security audit, and CI.

### Changed

- **Breaking:** replaced `js.js` with a nested ES module structure and the `fibonacci-odds` CLI.
- **Breaking:** replaced the Express route with versioned JSON endpoints.
- All identifiers and output are now in English.
- Node.js 22.12 or newer is required.

### Removed

- The undeclared `express` dependency.
- The background timer and unbounded in-memory sequence.

### Fixed

- Precision loss beyond `F(78)`.
- Double response in the HTTP handler.
- HTTP server that was defined but never started.

### Security

- Added strict input limits, security headers, request timeouts, and a loopback default bind.
- Rejected request targets that change under URL normalization, including backslashes, dot segments, encoded dot segments, and fragments.
- Enforced header and request timeouts on a one-second sweep instead of the 30-second runtime default.
- Reported bind failures as a one-line error instead of an uncaught exception.
- Rejected non-boolean `includeSeeds` values in the library API.
