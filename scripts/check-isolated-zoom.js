import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIR = process.argv[2] || '.';

// Matches zoom multiplication and division:
// e.g. x * zoom, 10 * camera.zoom, zoom * 2, offset / zoom, point.x / camera.zoom
const ZOOM_MATH_PATTERN = /(?:[\w)\]]\s*\*|[\w)\]]\s*\/)\s*(?:[a-zA-Z0-9_$]+\.)?zoom\b|\b(?:[a-zA-Z0-9_$]+\.)?zoom\s*\*\s*[\w(]/;

function isExemptFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  // camera.ts and its test files are the single source of truth for zoom math
  if (normalized.endsWith('camera.ts') || normalized.endsWith('camera.test.ts')) {
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
  const hits = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const normalized = fullPath.replace(/\\/g, '/');

    // Skip node_modules, dist, git, etc.
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '.gemini', 'fixtures'].includes(entry.name)) {
        continue;
      }
      hits.push(...scanDir(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) &&
      !isExemptFile(fullPath)
    ) {
      // Only scan packages and apps source trees if running against repo root
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

        // Strip single line comments
        const codeOnly = rawLine.split('//')[0];
        if (!codeOnly) continue;
        const trimmed = codeOnly.trim();

        // Skip block comment / JSDoc lines: e.g. " * zoom: number" or "/* zoom */"
        if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          continue;
        }

        if (ZOOM_MATH_PATTERN.test(trimmed)) {
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
  console.error('\n❌ ISOLATED ZOOM VIOLATION DETECTED:\n');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.code}`);
  }
  console.error('\nCamera and zoom coordinate math must strictly live in camera.ts.');
  console.error('All screen <-> page coordinate conversions must use pageToScreen / screenToPage from camera.ts.\n');
  process.exit(1);
}

console.log('✅ Isolated zoom check passed: zero zoom math occurrences outside camera.ts.');
