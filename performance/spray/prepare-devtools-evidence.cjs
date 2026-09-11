const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = __dirname;
const sourceDir = path.resolve(
  process.env.SPRAY_DEVTOOLS_SOURCE || path.join(root, 'artifacts', 'clean'),
);
const outputDir = path.resolve(
  process.env.SPRAY_DEVTOOLS_OUTPUT || path.join(root, 'evidence', 'devtools', 'traces'),
);
const inputs = [
  'spray-fast-drag-native-run-01.trace.json.gz',
  'spray-fast-drag-4x-run-01.trace.json.gz',
];

fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of inputs) {
  const source = path.join(sourceDir, fileName);
  const destination = path.join(outputDir, fileName.replace(/\.gz$/, ''));
  const compressed = fs.readFileSync(source);
  fs.writeFileSync(destination, zlib.gunzipSync(compressed));
  process.stdout.write(`${destination}\n`);
}
