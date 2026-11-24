import { createServer } from 'node:http';
import { ValidationError } from '../../shared/validation.js';
import { resolveRoute } from './router.js';

const MAX_REQUEST_TARGET_LENGTH = 512;
const ALLOWED_METHODS = 'GET, HEAD';
const CONNECTION_CHECK_INTERVAL_MS = 1_000;

const SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
});

function sendJson(response, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

function parseTarget(requestTarget) {
  if (
    requestTarget.length > MAX_REQUEST_TARGET_LENGTH ||
    !requestTarget.startsWith('/') ||
    requestTarget.startsWith('//')
  ) {
    return null;
  }
  try {
    const target = new URL(requestTarget, 'http://service.invalid');
    return `${target.pathname}${target.search}` === requestTarget ? target : null;
  } catch {
    return null;
  }
}

function handleRequest(request, response, { logError, resolve }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 405, { error: 'method not allowed' }, { Allow: ALLOWED_METHODS });
    return;
  }
  const target = parseTarget(request.url);
  if (!target) {
    sendJson(response, 400, { error: 'invalid request target' });
    return;
  }
  const route = resolve(target.pathname, target.searchParams);
  if (!route) {
    sendJson(response, 404, { error: 'not found' });
    return;
  }
  try {
    sendJson(response, 200, route());
  } catch (error) {
    if (error instanceof ValidationError) {
      sendJson(response, 400, { error: error.message });
      return;
    }
    logError(error);
    sendJson(response, 500, { error: 'internal server error' });
  }
}

export function createApiServer({ logError = console.error, resolve = resolveRoute } = {}) {
  const server = createServer({ connectionsCheckingInterval: CONNECTION_CHECK_INTERVAL_MS }, (request, response) =>
    handleRequest(request, response, { logError, resolve }),
  );
  server.headersTimeout = 5_000;
  server.requestTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 50;
  server.maxConnections = 256;
  return server;
}
