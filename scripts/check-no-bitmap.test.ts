import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('check-no-bitmap script unit tests', () => {
  it('passes on clean source tree (packages/canvas/src)', () => {
    const output = execSync('node scripts/check-no-bitmap.js', { encoding: 'utf-8' });
    expect(output).toContain('zero occurrences of getContext');
  });

  it('fails with exit code 1 when getContext is detected in fixture tree', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-bitmap-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'illegal-renderer.ts');
      fs.writeFileSync(fixtureFile, 'export function render() { return canvas.getContext("2d"); }');

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-no-bitmap.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('BITMAP CANVAS USAGE DETECTED');
      expect(errorOutput).toContain('getContext');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('respects // EXEMPTION: comments for non-render paths', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-bitmap-exemption-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'export-helper.ts');
      fs.writeFileSync(fixtureFile, 'const ctx = canvas.getContext("2d"); // EXEMPTION: export helper');

      const output = execSync(`node scripts/check-no-bitmap.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('zero occurrences of getContext');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
