import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const SCHEMA = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8');
const hasSqlite = spawnSync('sqlite3', ['-version']).status === 0;
const RUN = `INSERT INTO experiment_runs (id, experiment, application_version, runtime_version, started_at, duration_ms)
VALUES (1, 'odd_search', '2.0.0', 'v24', '2026-11-23T00:00:00Z', 1.5);`;

function execute(sql) {
  return spawnSync('sqlite3', ['-bail', ':memory:'], { input: `${SCHEMA}\n${sql}`, encoding: 'utf8' });
}

test('schema applies and stores a valid result', { skip: !hasSqlite }, () => {
  const result = execute(`${RUN}
INSERT INTO odd_search_results VALUES (1, 50, 0, 77, 50, 25, '5527939700884757');
SELECT sequence_length FROM odd_search_results;`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), '77');
});

test('schema is idempotent', { skip: !hasSqlite }, () => {
  assert.equal(execute(SCHEMA).status, 0);
});

for (const [name, statement] of [
  ['an inconsistent even count', "INSERT INTO odd_search_results VALUES (1, 50, 0, 77, 50, 24, '1');"],
  ['a non-numeric terminal value', "INSERT INTO odd_search_results VALUES (1, 50, 0, 77, 50, 25, '12x');"],
  ['a missing parent run', "INSERT INTO pisano_results VALUES (2, 10, 60);"],
  ['a period above the 6m bound', 'INSERT INTO pisano_results VALUES (1, 10, 61);'],
  ['a seed outside 32 bits', 'INSERT INTO parity_sample_results VALUES (1, 10, 10, 4294967296, 5, 0.5, 0.5, 0.2, 0.8);'],
]) {
  test(`schema rejects ${name}`, { skip: !hasSqlite }, () => {
    assert.notEqual(execute(`${RUN}\n${statement}`).status, 0);
  });
}

test('deleting a run cascades to its results', { skip: !hasSqlite }, () => {
  const result = execute(`${RUN}
INSERT INTO pisano_results VALUES (1, 10, 60);
DELETE FROM experiment_runs WHERE id = 1;
SELECT count(*) FROM pisano_results;`);
  assert.equal(result.stdout.trim(), '0');
});
