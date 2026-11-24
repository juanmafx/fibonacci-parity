#!/usr/bin/env node
import { runCli } from '../src/interfaces/cli/run.js';
import { loadServerConfig } from '../src/interfaces/http/config.js';
import { createApiServer } from '../src/interfaces/http/server.js';

function serve() {
  const { host, port } = loadServerConfig(process.env);
  const server = createApiServer();
  server.listen(port, host, () => {
    const address = server.address();
    console.log(`Listening on ${address.address}:${address.port}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.close(() => process.exit(0));
      server.closeIdleConnections();
    });
  }
}

if (process.argv[2] === 'serve') {
  try {
    serve();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
} else {
  process.exitCode = runCli(process.argv.slice(2), { stdout: process.stdout, stderr: process.stderr });
}
