import fs from 'node:fs';
import path from 'node:path';

const GOLDEN_PATH = path.resolve('docs/api-0.1.0.snapshot.json');

if (!fs.existsSync(GOLDEN_PATH)) {
  console.error(`\n❌ Golden API snapshot not found at ${GOLDEN_PATH}.\n`);
  process.exit(1);
}

const golden = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf-8'));
const goldenPackages = golden.packages || {};

const PACKAGES_TO_CHECK = [
  { name: '@open-draw/schema', dist: './packages/schema/dist/index.js' },
  { name: '@open-draw/canvas', dist: './packages/canvas/dist/index.js' },
];

let hasError = false;

for (const pkg of PACKAGES_TO_CHECK) {
  const distPath = path.resolve(pkg.dist);
  if (!fs.existsSync(distPath)) {
    console.error(`\n❌ Built dist output not found for ${pkg.name}: ${distPath}. Run npm run build first.\n`);
    process.exit(1);
  }

  const mod = await import(distPath);
  const actualExports = Object.keys(mod).sort();
  const expectedExports = (goldenPackages[pkg.name] || []).slice().sort();

  const added = actualExports.filter((x) => !expectedExports.includes(x));
  const removed = expectedExports.filter((x) => !actualExports.includes(x));

  if (added.length > 0 || removed.length > 0) {
    hasError = true;
    console.error(`\n❌ PUBLIC API MISMATCH in ${pkg.name}:`);
    if (added.length > 0) {
      console.error(`  - Uncommitted new exports (${added.length}): ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      console.error(`  - Missing expected exports (${removed.length}): ${removed.join(', ')}`);
    }
  }
}

if (hasError) {
  console.error('\nPublic API surface is frozen for 0.1.0. Any change to public exports requires an intentional update to docs/api-0.1.0.snapshot.json and documentation.\n');
  process.exit(1);
}

console.log('✅ Public API check passed: exports match docs/api-0.1.0.snapshot.json exactly.');
