import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('check-no-shape-branching script unit tests', () => {
  it('passes on clean source tree', () => {
    const output = execSync('node scripts/check-no-shape-branching.js', { encoding: 'utf-8' });
    expect(output).toContain('zero shape-type branching occurrences outside shape modules');
  });

  it('fails with exit code 1 when shape.type === "rect" is detected in a core engine file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-branch-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'illegal-core.ts');
      fs.writeFileSync(fixtureFile, 'export function render(shape: any) { if (shape.type === "rect") { return null; } }');

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-no-shape-branching.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('SHAPE TYPE BRANCHING VIOLATION DETECTED');
      expect(errorOutput).toContain('illegal-core.ts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails when switch (shape.type) is detected', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-branch-switch-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'illegal-switch.ts');
      fs.writeFileSync(fixtureFile, 'export function handle(shape: any) { switch (shape.type) { case "rect": break; } }');

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-no-shape-branching.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('SHAPE TYPE BRANCHING VIOLATION DETECTED');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('permits shape type definitions inside shapes/ directory', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-shapes-exempt-test-'));
    try {
      const shapesDir = path.join(tempDir, 'shapes');
      fs.mkdirSync(shapesDir, { recursive: true });
      const fixtureFile = path.join(shapesDir, 'rect.ts');
      fs.writeFileSync(fixtureFile, 'export function isRect(s: any) { return s.type === "rect"; }');

      const output = execSync(`node scripts/check-no-shape-branching.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('zero shape-type branching occurrences outside shape modules');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('respects // EXEMPTION: comments', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-branch-exemption-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'debug.ts');
      fs.writeFileSync(fixtureFile, 'const isRect = shape.type === "rect"; // EXEMPTION: debug log');

      const output = execSync(`node scripts/check-no-shape-branching.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('zero shape-type branching occurrences outside shape modules');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
