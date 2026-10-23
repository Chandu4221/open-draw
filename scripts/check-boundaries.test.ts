import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('check-boundaries script unit tests', () => {
  it('passes on clean workspace boundary tree', () => {
    const output = execSync('node scripts/check-boundaries.js', { encoding: 'utf-8' });
    expect(output).toContain('Import boundaries verified');
  });

  it('fails with exit code 1 when canvas imports semantics or leaks breakpoint keyword', () => {
    const tempFile = path.join('packages/canvas/src', '__test_boundary_violation__.ts');
    try {
      fs.writeFileSync(tempFile, 'export const leak = "breakpoint";\n');
      let failed = false;
      let errorOutput = '';
      try {
        execSync('node scripts/check-boundaries.js', { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }
      expect(failed).toBe(true);
      expect(errorOutput).toContain('IMPORT BOUNDARY VIOLATIONS DETECTED');
      expect(errorOutput).toContain('breakpoint');
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it('fails with exit code 1 when canvas leaks compile keyword', () => {
    const tempFile = path.join('packages/canvas/src', '__test_boundary_compile_violation__.ts');
    try {
      fs.writeFileSync(tempFile, 'export const leak = "compile";\n');
      let failed = false;
      let errorOutput = '';
      try {
        execSync('node scripts/check-boundaries.js', { encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        failed = true;
        errorOutput = err.stderr || err.stdout;
      }
      expect(failed).toBe(true);
      expect(errorOutput).toContain('IMPORT BOUNDARY VIOLATIONS DETECTED');
      expect(errorOutput).toContain('compile');
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });
});
