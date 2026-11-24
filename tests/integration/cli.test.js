import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runCli } from '../../src/interfaces/cli/run.js';

const BIN = fileURLToPath(new URL('../../bin/fibonacci-odds.js', import.meta.url));

function invoke(...argv) {
  let out = '';
  let err = '';
  const code = runCli(argv, {
    stdout: { write: (text) => (out += text) },
    stderr: { write: (text) => (err += text) },
  });
  return { code, out, err };
}

test('search defaults to the original experiment', () => {
  const { code, out } = invoke('search');
  assert.equal(code, 0);
  assert.equal(JSON.parse(out).terminalValue, '5527939700884757');
});

test('search accepts include-seeds', () => {
  assert.equal(JSON.parse(invoke('search', '--target', '2', '--include-seeds').out).sequenceLength, 2);
});

test('term, sample and pisano commands produce JSON', () => {
  assert.equal(JSON.parse(invoke('term', '--index', '10').out).value, '55');
  assert.equal(JSON.parse(invoke('sample', '--samples', '10', '--max-index', '10', '--seed', '1').out).samples, 10);
  assert.equal(JSON.parse(invoke('pisano', '--modulus', '10').out).period, 60);
});

test('help exits zero and a missing command exits two', () => {
  assert.equal(invoke('--help').code, 0);
  assert.equal(invoke().code, 2);
});

for (const argv of [
  ['unknown'],
  ['constructor'],
  ['__proto__'],
  ['term'],
  ['term', '--index', 'abc'],
  ['term', '--index', '100001'],
  ['search', '--nope'],
  ['search', 'positional'],
  ['pisano', '--modulus', '0'],
]) {
  test(`usage error for: ${argv.join(' ')}`, () => {
    const { code, err } = invoke(...argv);
    assert.equal(code, 2);
    assert.ok(err.length > 0);
  });
}

test('the executable runs end to end', () => {
  const result = spawnSync(process.execPath, [BIN, 'search', '--target', '50'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).sequenceLength, 77);
});

test('serve binds, answers and stops on SIGTERM', async () => {
  const child = spawn(process.execPath, [BIN, 'serve'], {
    env: { PATH: process.env.PATH, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const [chunk] = await once(child.stdout, 'data');
  const port = /:(\d+)/.exec(chunk.toString())[1];
  const response = await fetch(`http://127.0.0.1:${port}/healthz`, { headers: { connection: 'close' } });
  assert.equal(response.status, 200);
  await response.arrayBuffer();
  child.kill('SIGTERM');
  const [code] = await once(child, 'exit');
  assert.equal(code, 0);
});

test('serve rejects invalid configuration', () => {
  const result = spawnSync(process.execPath, [BIN, 'serve'], {
    env: { PATH: process.env.PATH, PORT: 'invalid' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 2);
});
