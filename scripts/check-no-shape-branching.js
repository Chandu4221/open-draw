import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = process.argv[2] || '.';

// Matches shape type branching: e.g. shape.type === 'rect', switch (shape.type)
// Excludes generic JavaScript typeof checks: e.g. typeof item.type !== 'string'
const SHAPE_BRANCH_PATTERN = /(?:(?<!typeof\s+)\b(?:shape|record|s|item)\.type\s*===\s*['"][a-zA-Z0-9_-]+['"]|(?<!typeof\s+)\b(?:shape|record|s|item)\.type\s*!==\s*(?!'string'|"string"|'undefined'|"undefined")['"][a-zA-Z0-9_-]+['"]|switch\s*\([^)]*\.type\))/;

function isExemptFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // Shapes define their own type in packages/canvas/src/shapes/**
  if (normalized.includes('/shapes/')) {
    return true;
  }
  // Scripts and tool checks themselves are exempt
  if (normalized.includes('/scripts/')) {
    return true;
  }
  // Test files asserting type are exempt
  if (normalized.endsWith('.test.ts') || normalized.endsWith('.spec.ts') || normalized.includes('/e2e/')) {
    return true;
  }
  return false;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hits = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const normalized = fullPath.replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.gemini', 'fixtures'].includes(entry.name)) {
        continue;
      }
      hits.push(...scanDir(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) &&
      !isExemptFile(fullPath)
    ) {
      const inSourceTree =
        normalized.startsWith('packages/') ||
        normalized.includes('/packages/') ||
        normalized.startsWith('apps/') ||
        normalized.includes('/apps/');
      if (TARGET_DIR === '.' && !inSourceTree) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (!rawLine) continue;

        if (rawLine.includes('// EXEMPTION:')) {
          continue;
        }

        const codeOnly = rawLine.split('//')[0];
        if (!codeOnly) continue;
        const trimmed = codeOnly.trim();

        if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          continue;
        }

        if (SHAPE_BRANCH_PATTERN.test(trimmed)) {
          hits.push({
            file: fullPath,
            line: i + 1,
            code: trimmed,
          });
        }
      }
    }
  }

  return hits;
}

const violations = scanDir(TARGET_DIR);

if (violations.length > 0) {
  console.error('\n❌ SHAPE TYPE BRANCHING VIOLATION DETECTED:\n');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.code}`);
  }
  console.error('\nOpenDraw requires zero hardcoded shape types in the canvas engine core.');
  console.error('Shapes must be implemented as ShapeDefinition plugins, and capabilities must be accessed via capability interfaces.\n');
  process.exit(1);
}

console.log('✅ Shape branching check passed: zero shape-type branching occurrences outside shape modules.');
