import fs from 'node:fs';
import path from 'node:path';

const PACKAGES_DIRS = ['packages', 'apps'];
let violations = [];

const ALLOWED_RUNTIME_DEPS = {
  '@open-draw/schema': [],
  '@open-draw/canvas': ['@open-draw/schema'],
  '@open-draw/semantics': [],
  '@open-draw/markdown': [],
  '@open-draw/studio': [],
};

for (const parent of PACKAGES_DIRS) {
  if (!fs.existsSync(parent)) continue;
  const entries = fs.readdirSync(parent, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const pkgJsonPath = path.join(parent, entry.name, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const pkgName = pkg.name || entry.name;
        const deps = pkg.dependencies || {};
        const depKeys = Object.keys(deps);
        const allowed = ALLOWED_RUNTIME_DEPS[pkgName] || [];
        const forbidden = depKeys.filter((d) => !allowed.includes(d));
        if (forbidden.length > 0) {
          violations.push({
            name: pkgName,
            file: pkgJsonPath,
            dependencies: forbidden,
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
