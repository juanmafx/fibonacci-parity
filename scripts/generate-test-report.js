import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(root, 'reports', 'tests');
const run = spawnSync(process.execPath, ['--test', '--test-reporter=junit'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const junit = run.stdout
  .replaceAll(root, '.')
  .replace(/ hostname="[^"]*"/g, '')
  .replace(/ time="[^"]*"/g, '')
  .replace(/<!-- duration_ms .*? -->\n?/g, '');
const counter = (name) => Number(new RegExp(`<!-- ${name} (\\d+) -->`).exec(junit)?.[1] ?? 0);
const summary = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  command: 'npm run test:report',
  exitCode: run.status,
  tests: counter('tests'),
  passed: counter('pass'),
  failed: counter('fail'),
  skipped: counter('skipped'),
  cancelled: counter('cancelled'),
  todo: counter('todo'),
};
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'junit.xml'), junit);
writeFileSync(join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary));
process.exitCode = run.status === 0 && summary.tests > 0 ? 0 : 1;
