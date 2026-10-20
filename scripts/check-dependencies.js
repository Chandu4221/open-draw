import fs from 'node:fs';
import path from 'node:path';

const PACKAGES_DIRS = ['packages', 'apps'];
let violations = [];

for (const parent of PACKAGES_DIRS) {
  if (!fs.existsSync(parent)) continue;
  const entries = fs.readdirSync(parent, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pkgJsonPath = path.join(parent, entry.name, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const deps = pkg.dependencies || {};
        const depKeys = Object.keys(deps);
        if (depKeys.length > 0) {
          violations.push({
            name: pkg.name || entry.name,
            file: pkgJsonPath,
            dependencies: depKeys,
          });
        }
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ RUNTIME DEPENDENCY VIOLATION:\n');
  for (const v of violations) {
    console.error(`- ${v.name} (${v.file}) has forbidden runtime dependencies: ${v.dependencies.join(', ')}`);
  }
  console.error('\nAll OpenDraw packages must maintain zero runtime dependencies (dependencies: {}).\n');
  process.exit(1);
}

console.log('✅ Dependencies verified: all workspace packages have zero runtime dependencies (dependencies: {}).');
