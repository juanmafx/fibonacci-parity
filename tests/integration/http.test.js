import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { connect } from 'node:net';
import { createApiServer } from '../../src/interfaces/http/server.js';
import { loadServerConfig } from '../../src/interfaces/http/config.js';
import { ValidationError } from '../../src/index.js';

let server;
let port;

function send(path, method = 'GET', targetPort = port) {
  return new Promise((resolve, reject) => {
    const outgoing = httpRequest({ host: '127.0.0.1', port: targetPort, path, method }, (incoming) => {
      const chunks = [];
      incoming.on('data', (chunk) => chunks.push(chunk));
      incoming.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        resolve({ status: incoming.statusCode, headers: incoming.headers, text, body: text ? JSON.parse(text) : null });
      });
    });
    outgoing.on('error', reject);
    outgoing.end();
  });
}

before(async () => {
  server = createApiServer({ logError: () => {} });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('root lists the endpoints', async () => {
  const { status, body } = await send('/');
  assert.equal(status, 200);
  assert.ok(body.endpoints.includes('GET /healthz'));
});

test('health endpoint responds', async () => {
  assert.deepEqual((await send('/healthz')).body, { status: 'ok' });
});

test('every response carries the security headers', async () => {
  for (const path of ['/healthz', '/missing', '/v1/terms/abc']) {
    const { headers } = await send(path);
    assert.equal(headers['x-content-type-options'], 'nosniff');
    assert.equal(headers['cache-control'], 'no-store');
    assert.equal(headers['referrer-policy'], 'no-referrer');
    assert.match(headers['content-security-policy'], /default-src 'none'/);
    assert.match(headers['content-type'], /^application\/json/);
  }
});

test('term endpoint serializes big values as strings', async () => {
  const { status, body } = await send('/v1/terms/100');
  assert.equal(status, 200);
  assert.deepEqual(body, { index: 100, value: '354224848179261915075', parity: 'odd' });
});

test('odd search defaults to the original experiment', async () => {
  const { body } = await send('/v1/odd-search');
  assert.equal(body.sequenceLength, 77);
  assert.equal(body.evenCount, 25);
});

test('odd search honors includeSeeds', async () => {
  const { body } = await send('/v1/odd-search?target=2&includeSeeds=true');
  assert.equal(body.sequenceLength, 2);
});

test('parity sample is reproducible over HTTP', async () => {
  const path = '/v1/parity-sample?samples=500&maxIndex=1000&seed=9';
  assert.deepEqual((await send(path)).body, (await send(path)).body);
});

test('pisano endpoint responds', async () => {
  assert.deepEqual((await send('/v1/pisano/10')).body, { modulus: 10, period: 60 });
});

for (const path of [
  '/v1/terms/-1',
  '/v1/terms/1e3',
  '/v1/terms/007',
  '/v1/terms/100001',
  '/v1/terms/%31',
  '/v1/terms/1?extra=1',
  '/v1/odd-search?target=60001',
  '/v1/odd-search?target=1&target=2',
  '/v1/odd-search?includeSeeds=maybe',
  '/v1/odd-search?unknown=1',
  '/v1/parity-sample?samples=20001',
  '/v1/parity-sample?seed=4294967296',
  '/v1/pisano/0',
  '/v1/pisano/100001',
  '//evil.invalid/healthz',
  '/\\evil.invalid/healthz',
  '/v1/terms/../pisano/10',
  '/v1/./terms/5',
  '/%2e%2e/healthz',
  '/v1/%2E%2E/healthz',
  '/healthz#fragment',
  '/healthz?',
  `/healthz?padding=${'a'.repeat(600)}`,
]) {
  test(`rejects ${path.slice(0, 48)}`, async () => {
    const { status, body } = await send(path);
    assert.equal(status, 400);
    assert.equal(typeof body.error, 'string');
  });
}

test('unknown paths return 404', async () => {
  assert.equal((await send('/v2/anything')).status, 404);
});

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  test(`${method} is rejected with an Allow header`, async () => {
    const { status, headers } = await send('/healthz', method);
    assert.equal(status, 405);
    assert.equal(headers.allow, 'GET, HEAD');
  });
}

test('HEAD returns headers without a body', async () => {
  const { status, text, headers } = await send('/healthz', 'HEAD');
  assert.equal(status, 200);
  assert.equal(text, '');
  assert.ok(Number(headers['content-length']) > 0);
});

test('unexpected errors return a generic 500 and are logged', async () => {
  const logged = [];
  const failing = createApiServer({
    logError: (error) => logged.push(error.message),
    resolve: () => () => {
      throw new Error('internal detail');
    },
  });
  await new Promise((resolve) => failing.listen(0, '127.0.0.1', resolve));
  const { status, text, headers } = await send('/healthz', 'GET', failing.address().port);
  failing.closeAllConnections();
  await new Promise((resolve) => failing.close(resolve));
  assert.equal(status, 500);
  assert.deepEqual(JSON.parse(text), { error: 'internal server error' });
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.deepEqual(logged, ['internal detail']);
});

test('an incomplete request is closed soon after the headers timeout', async () => {
  const guarded = createApiServer();
  guarded.headersTimeout = 200;
  await new Promise((resolve) => guarded.listen(0, '127.0.0.1', resolve));
  const socket = connect(guarded.address().port, '127.0.0.1');
  socket.on('error', () => {});
  socket.resume();
  socket.write('GET /healthz HTTP/1.1\r\nHost: localhost\r\nX-Partial: ');
  const startedAt = performance.now();
  const closed = once(socket, 'close');
  const deadline = new Promise((resolve) => setTimeout(resolve, 5_000).unref());
  await Promise.race([closed, deadline]);
  const elapsed = performance.now() - startedAt;
  socket.destroy();
  guarded.closeAllConnections();
  await new Promise((resolve) => guarded.close(resolve));
  assert.ok(elapsed < 3_000, `socket stayed open for ${Math.round(elapsed)} ms`);
});

test('server configuration defaults to loopback', () => {
  assert.deepEqual(loadServerConfig({}), { host: '127.0.0.1', port: 8000 });
  assert.deepEqual(loadServerConfig({ HOST: '0.0.0.0', PORT: '9000' }), { host: '0.0.0.0', port: 9000 });
});

test('server configuration rejects invalid values', () => {
  assert.throws(() => loadServerConfig({ PORT: '70000' }), ValidationError);
  assert.throws(() => loadServerConfig({ PORT: 'abc' }), ValidationError);
  assert.throws(() => loadServerConfig({ HOST: 'bad host/' }), ValidationError);
});
