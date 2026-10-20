import fs from 'node:fs';
import path from 'node:path';

// Target docs/**, memory/**, and root *.md per spec
const TARGET_DIRS = ['docs', 'memory'];

function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Root-level markdown files
const rootFiles = fs.readdirSync('.')
  .filter((f) => f.endsWith('.md'))
  .map((f) => path.join('.', f));

const allMarkdownFiles = [
  ...rootFiles,
  ...TARGET_DIRS.flatMap(findMarkdownFiles),
];

let violations = [];

for (const file of allMarkdownFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for file:// links or absolute file:// references
    if (line.includes('file://')) {
      violations.push({
        file,
        line: i + 1,
        content: line.trim(),
      });
    }
  }
}

if (violations.length > 0) {
  console.error('\n❌ NON-PORTABLE FILE:// LINKS DETECTED in docs/** or *.md:\n');
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} -> ${v.content}`);
  }
  console.error('\nAll documentation and verification links must be repo-relative for GitHub portability.\n');
  process.exit(1);
}

console.log('✅ Portable links check passed: zero file:// links found in docs/** and root markdown files.');
