import fs from 'node:fs';
import path from 'node:path';

// Guardrail: Bans getContext in DOM Canvas render paths.
// EXEMPTION POLICY (Q-006 / Phase 2.s §2):
// The live engine render path is strictly 100% SVG/DOM. getContext is permitted
// ONLY in serialization-only pathways (e.g. packages/canvas/src/export/png.ts)
// where SVG is rasterized to a PNG Blob for AI/export flows, marked with `// EXEMPTION:`.
const CANVAS_SRC = process.argv[2] || 'packages/canvas/src';

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const hits = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      hits.push(...scanDir(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('getContext') && !line.includes('// EXEMPTION:')) {
          hits.push({
            file: fullPath,
            line: i + 1,
            code: line.trim(),
          });
        }
      }
    }
  }
  return hits;
}

const violations = scanDir(CANVAS_SRC);

if (violations.length > 0) {
  console.error('\n❌ BITMAP CANVAS USAGE DETECTED in DOM Canvas engine:\n');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.code}`);
  }
  console.error('\nOpenDraw is a pure DOM Canvas. Every shape must be a real SVG/DOM element. getContext is forbidden.\n');
  process.exit(1);
}

console.log('✅ Bitmap check passed: zero occurrences of getContext in packages/canvas/src.');
