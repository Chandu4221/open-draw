import fs from 'node:fs';
import path from 'node:path';

// Allowed package imports per package:
const ALLOWED_IMPORTS = {
  '@open-draw/schema': [],
  '@open-draw/canvas': ['@open-draw/schema'],
  '@open-draw/semantics': ['@open-draw/schema'],
  '@open-draw/markdown': ['@open-draw/semantics', '@open-draw/schema'],
  '@open-draw/studio': [
    '@open-draw/canvas',
    '@open-draw/semantics',
    '@open-draw/markdown',
    '@open-draw/schema',
  ],
};

const ALL_INTERNAL_PACKAGES = Object.keys(ALLOWED_IMPORTS);

const PACKAGE_DIRS = [
  { name: '@open-draw/schema', dir: 'packages/schema' },
  { name: '@open-draw/canvas', dir: 'packages/canvas' },
  { name: '@open-draw/semantics', dir: 'packages/semantics' },
  { name: '@open-draw/markdown', dir: 'packages/markdown' },
  { name: '@open-draw/studio', dir: 'apps/studio' },
];

function getFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];
  
  // Match ES imports/exports: import ... from '...'; export ... from '...'; import('...'); require('...')
  const importRegex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)|require\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const specifier = match[1] || match[2] || match[3];
    if (specifier) imports.push(specifier);
  }

  // Also check for direct relative escapes outside the package root (e.g. ../../canvas)
  const relativeEscapeRegex = /['"](\.\.\/\.\.\/[^'"]+)['"]/g;
  while ((match = relativeEscapeRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

let violations = [];

for (const pkg of PACKAGE_DIRS) {
  const allowed = ALLOWED_IMPORTS[pkg.name] || [];
  
  // Check source files and compiled dist files
  const filesToCheck = [
    ...getFiles(path.join(pkg.dir, 'src'), ['.ts', '.tsx', '.js']),
    ...getFiles(path.join(pkg.dir, 'dist'), ['.js', '.d.ts']),
  ];

  for (const file of filesToCheck) {
    const specifiers = extractImports(file);
    for (const specifier of specifiers) {
      // Check if importing another internal package
      for (const internalPkg of ALL_INTERNAL_PACKAGES) {
        if (internalPkg === pkg.name) continue; // self-import (or within pkg)
        
        const isTarget = specifier === internalPkg || specifier.startsWith(`${internalPkg}/`);
        if (isTarget && !allowed.includes(internalPkg)) {
          violations.push({
            package: pkg.name,
            file,
            import: specifier,
            allowed,
          });
        }
      }

      // Check if relative import attempts to reach into another package directory directly
      if (specifier.includes('packages/') || specifier.includes('apps/')) {
        violations.push({
          package: pkg.name,
          file,
          import: specifier,
          allowed,
          reason: 'Direct relative path escape into another workspace package',
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ IMPORT BOUNDARY VIOLATIONS DETECTED:\n');
  for (const v of violations) {
    console.error(`- [${v.package}] in ${v.file}:`);
    console.error(`  Imported: "${v.import}"`);
    console.error(`  Allowed imports for this package: ${JSON.stringify(v.allowed)}`);
    if (v.reason) console.error(`  Reason: ${v.reason}`);
    console.error('');
  }
  process.exit(1);
}

console.log('✅ Import boundaries verified: all one-way dependency rules satisfied.');
