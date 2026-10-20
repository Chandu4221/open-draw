import fs from 'node:fs';
import path from 'node:path';

const MAX_LINES = 300;
const TARGET_DIR = process.argv[2] || '.';

function isExemptFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // Test files, E2E specs, and fixtures are exempt
  if (
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.test.js') ||
    normalized.endsWith('.spec.ts') ||
    normalized.endsWith('.spec.js') ||
    normalized.includes('/e2e/') ||
    normalized.includes('/fixtures/') ||
    normalized.includes('/test-fixtures/')
  ) {
    return true;
  }
  // Scripts and tool checks themselves are exempt
  if (normalized.includes('/scripts/')) {
    return true;
  }
  return false;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const normalized = fullPath.replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.gemini', 'fixtures', 'test-fixtures'].includes(entry.name)) {
        continue;
      }
      violations.push(...scanDir(fullPath));
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
      if (content.includes('// EXEMPTION: file-size')) {
        continue;
      }

      const lines = content.split('\n');
      // If the last line is empty due to trailing newline, ignore it
      const lineCount = lines.length > 0 && lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;

      if (lineCount > MAX_LINES) {
        violations.push({
          file: fullPath,
          lineCount,
        });
      }
    }
  }

  return violations;
}

const violations = scanDir(TARGET_DIR);

if (violations.length > 0) {
  console.error(`\n❌ FILE SIZE VIOLATION DETECTED (max allowed: ${MAX_LINES} lines):\n`);
  for (const v of violations) {
    console.error(`- ${v.file}: ${v.lineCount} lines (exceeds ${MAX_LINES})`);
  }
  console.error('\nOpenDraw strictly enforces modular design to prevent god-files.');
  console.error('Split files by responsibility (geometry, render, defs, capabilities) before proceeding.\n');
  process.exit(1);
}

console.log(`✅ File size check passed: all source files within ${MAX_LINES} lines limit.`);
