# Release Notes: 2.0.0

**Status:** prepared, not yet tagged or published.

Version 2.0.0 turns a 2020 exploratory script into a tested Fibonacci parity toolkit. It reproduces the original result (50 odd terms, 25 even terms, sequence length 77, terminal value `5527939700884757`) with an exact closed-form method.

## Highlights

- Exact arbitrary-precision terms through fast doubling.
- k-th odd term search, Pisano periods, and reproducible seeded sampling.
- A CLI and a hardened read-only HTTP API with no runtime dependencies.
- Unit, property-based, statistical, and integration tests.

## Upgrade notes

- `node js.js` is replaced by `node bin/fibonacci-odds.js search`.
- Node.js 22.12 or newer is required.
- The old `/` route now returns a service descriptor. Use the `/v1` endpoints for data.

## Verification

```bash
npm ci --ignore-scripts
npm test
```

The test report for this version is in `reports/tests/`.
