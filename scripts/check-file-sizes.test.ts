import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('check-file-sizes script unit tests', () => {
  it('passes on clean source tree', () => {
    const output = execSync('node scripts/check-file-sizes.js', { encoding: 'utf-8' });
    expect(output).toContain('all source files within 300 lines limit');
  });

  it('fails with exit code 1 when a source file has > 300 lines', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-size-test-'));
    try {
      const pkgDir = path.join(tempDir, 'packages', 'dummy', 'src');
      fs.mkdirSync(pkgDir, { recursive: true });
      const bigFile = path.join(pkgDir, 'big-module.ts');
      const lines = Array.from({ length: 350 }, (_, i) => `// Line ${i + 1}`).join('\n');
      fs.writeFileSync(bigFile, lines);

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-file-sizes.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('FILE SIZE VIOLATION DETECTED');
      expect(errorOutput).toContain('big-module.ts');
      expect(errorOutput).toContain('350 lines');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('exempts .test.ts and .spec.ts files even if > 300 lines', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-size-exempt-test-'));
    try {
      const pkgDir = path.join(tempDir, 'packages', 'dummy', 'src');
      fs.mkdirSync(pkgDir, { recursive: true });
      const testFile = path.join(pkgDir, 'large.test.ts');
      const specFile = path.join(pkgDir, 'large.spec.ts');
      const lines = Array.from({ length: 350 }, (_, i) => `// Line ${i + 1}`).join('\n');
      fs.writeFileSync(testFile, lines);
      fs.writeFileSync(specFile, lines);

      const output = execSync(`node scripts/check-file-sizes.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('all source files within 300 lines limit');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('exempts files in fixtures directories', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-size-fixture-test-'));
    try {
      const fixturesDir = path.join(tempDir, 'packages', 'dummy', 'src', 'fixtures');
      fs.mkdirSync(fixturesDir, { recursive: true });
      const fixtureFile = path.join(fixturesDir, 'snapshot.ts');
      const lines = Array.from({ length: 350 }, (_, i) => `// Line ${i + 1}`).join('\n');
      fs.writeFileSync(fixtureFile, lines);

      const output = execSync(`node scripts/check-file-sizes.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('all source files within 300 lines limit');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('respects // EXEMPTION: file-size comments', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-size-comment-test-'));
    try {
      const pkgDir = path.join(tempDir, 'packages', 'dummy', 'src');
      fs.mkdirSync(pkgDir, { recursive: true });
      const exemptFile = path.join(pkgDir, 'exempt.ts');
      const lines = ['// EXEMPTION: file-size', ...Array.from({ length: 350 }, (_, i) => `// Line ${i + 1}`)].join('\n');
      fs.writeFileSync(exemptFile, lines);

      const output = execSync(`node scripts/check-file-sizes.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('all source files within 300 lines limit');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
