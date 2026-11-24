# sigularesEnFivona

Exact Fibonacci parity analysis in dependency-free Node.js, available as a library, a CLI, and a hardened read-only HTTP API.

> **Project history:** originally created in 2020 as a single exploratory script, modernized in 2026.

## Purpose

The project answers one concrete question: **how far along the Fibonacci sequence must you go to see a given number of odd terms, and how many even terms appear on the way?** It then generalizes that question into a small, verifiable toolkit for studying the sequence modulo `m`.

## Why this project exists

The original script answered the question by brute force. It stored every term in a growing array of IEEE 754 numbers, so it would silently lose precision after `F(78)` if it ran long enough. The mathematics allows something much better: Fibonacci parity has period 3, so the answer has a closed form. This version keeps the original result as a regression test and replaces the search with an exact algorithm whose correctness is checked against independent oracles.

## What it does

| Capability | Method | Time |
| --- | --- | --- |
| Exact term `F(n)` | Fast doubling on `BigInt` | `O(M(n))` |
| `F(n) mod m` | Modular fast doubling | `O(log n)` multiplications |
| Locate the k-th odd term | Closed form | `O(1)` for the index |
| Pisano period `π(m)` | Cycle detection | `O(π(m))`, at most `6m` steps |
| Odd-proportion estimate | Seeded Monte Carlo with a Wilson interval | `O(s log N)` multiplications |

`M(n)` is the cost of multiplying two `n`-bit integers. The derivations are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Architecture

```text
bin/fibonacci-odds.js     Executable entry point
src/
  domain/                 Pure mathematics
  random/                 Seeded generator and unbiased integer sampling
  statistics/             Confidence intervals
  experiments/            Odd-term search and parity sampling
  interfaces/cli/         Argument parsing and JSON output
  interfaces/http/        Routing, validation, and security headers
  shared/                 Input limits and validation
tests/                    Unit, property, statistical, and integration suites
db/schema.sql             Optional SQLite schema
reports/tests/            Report from a real test run
```

Dependencies point inward: interfaces call experiments, experiments call the domain, and the domain performs no I/O. The project has no client application, so there is no `frontend/` and `backend/` split.

## Quick start

Requires Node.js 22.12 or newer. The project has no runtime dependencies.

```bash
npm ci --ignore-scripts
npm test
node bin/fibonacci-odds.js search
```

```json
{
  "target": 50,
  "includeSeeds": false,
  "sequenceLength": 77,
  "oddCount": 50,
  "evenCount": 25,
  "terminalValue": "5527939700884757"
}
```

By default, the search preserves the original script's rule: the two seed terms `F(1)` and `F(2)` are not counted. Pass `--include-seeds` to count them.

## Usage guide

### CLI

```bash
node bin/fibonacci-odds.js search --target 1000
node bin/fibonacci-odds.js search --target 2 --include-seeds
node bin/fibonacci-odds.js term --index 100
node bin/fibonacci-odds.js pisano --modulus 10
node bin/fibonacci-odds.js sample --samples 20000 --max-index 1000000000 --seed 7
```

The same arguments and seed always produce the same sample. Commands print JSON and exit with `2` on invalid input.

### HTTP API

```bash
npm start
curl 'http://127.0.0.1:8000/v1/odd-search?target=50'
```

| Endpoint | Description |
| --- | --- |
| `GET /` | Service descriptor |
| `GET /healthz` | Health check |
| `GET /v1/terms/{index}` | Exact term and parity; values are decimal strings |
| `GET /v1/odd-search?target=&includeSeeds=` | Odd-term search |
| `GET /v1/parity-sample?samples=&maxIndex=&seed=` | Reproducible sampling |
| `GET /v1/pisano/{modulus}` | Pisano period |

### Library

```js
import { fibonacci, pisanoPeriod, searchOddTerm } from 'sigulares-en-fivona';

fibonacci(100);
pisanoPeriod(10);
searchOddTerm({ target: 50 });
```

The package is private and is not published to npm. Import it from a local checkout or workspace.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `8000` | Bind port |

| Input limit | Value |
| --- | --- |
| Term index | 100,000 |
| Odd-search target | 60,000 |
| Samples per request | 20,000 |
| Sampling index | 1,000,000,000 |
| Modulus | 100,000 |

## Testing

```bash
npm test
npm run test:coverage
npm run test:report
```

- **Unit:** published sequence values, boundaries, and the original script's result.
- **Property-based:** Cassini's identity, the GCD identity, the recurrence, and agreement with linear oracles, using `fast-check` with a fixed seed.
- **Statistical:** chi-square uniformity and Wilson interval coverage over 400 seeds.
- **Integration:** HTTP behavior, CLI behavior, process lifecycle, and SQL constraints.

The latest real run is committed in [reports/tests/](reports/tests/). The SQL tests need the `sqlite3` command and are skipped when it is unavailable.

## Database

**The database is optional.** The application does not read or write it. [db/schema.sql](db/schema.sql) is a strict SQLite schema for anyone who wants to archive experiment results:

```bash
sqlite3 results.db < db/schema.sql
```

Enable `PRAGMA foreign_keys = ON` on each connection that writes to the database.

## Security notes

The API is read-only, stores no data, has no accounts, binds to loopback by default, and enforces strict input limits. It does not provide TLS, authentication, or rate limiting, so put it behind a reverse proxy that does before exposing it publicly. See [SECURITY.md](SECURITY.md) and [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md).

## Credits

- Original script by Juan Manuel Ramallo.
- The Mulberry32 generator is by Tommy Ettinger. It is not cryptographically secure and is used only for reproducible sampling.
- The Wilson score interval is from E. B. Wilson (1927).
- [`fast-check`](https://github.com/dubzzz/fast-check) is a development dependency.

## License

The repository does not currently declare a license, so no reuse rights are granted by default.
