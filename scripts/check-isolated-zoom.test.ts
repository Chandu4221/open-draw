import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('check-isolated-zoom script unit tests', () => {
  it('passes on clean source tree', () => {
    const output = execSync('node scripts/check-isolated-zoom.js', { encoding: 'utf-8' });
    expect(output).toContain('zero zoom math occurrences outside camera.ts');
  });

  it('fails with exit code 1 when * zoom is detected in a non-camera file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-zoom-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'illegal-renderer.ts');
      fs.writeFileSync(fixtureFile, 'export function render(x: number, zoom: number) { return x * zoom; }');

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-isolated-zoom.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('ISOLATED ZOOM VIOLATION DETECTED');
      expect(errorOutput).toContain('illegal-renderer.ts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fails when / zoom is detected in a non-camera file', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-zoom-div-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'illegal-div.ts');
      fs.writeFileSync(fixtureFile, 'export function toPage(x: number, zoom: number) { return x / zoom; }');

      let failed = false;
      let errorOutput = '';
      try {
        execSync(`node scripts/check-isolated-zoom.js "${tempDir}"`, { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }

      expect(failed).toBe(true);
      expect(errorOutput).toContain('ISOLATED ZOOM VIOLATION DETECTED');
      expect(errorOutput).toContain('illegal-div.ts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('permits zoom math in files named camera.ts', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-camera-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'camera.ts');
      fs.writeFileSync(fixtureFile, 'export function transform(x: number, zoom: number) { return x * zoom; }');

      const output = execSync(`node scripts/check-isolated-zoom.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('zero zoom math occurrences outside camera.ts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('respects // EXEMPTION: comments for non-render paths', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'od-zoom-exemption-test-'));
    try {
      const fixtureFile = path.join(tempDir, 'debug-tool.ts');
      fs.writeFileSync(fixtureFile, 'const visualScale = factor * zoom; // EXEMPTION: debug scale visualization');

      const output = execSync(`node scripts/check-isolated-zoom.js "${tempDir}"`, { encoding: 'utf-8' });
      expect(output).toContain('zero zoom math occurrences outside camera.ts');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
