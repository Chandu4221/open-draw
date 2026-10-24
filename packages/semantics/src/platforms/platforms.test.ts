import { describe, it, expect } from 'vitest';
import { getPlatformProfile, listPlatformProfiles } from './index.js';
import { getStyleProfile, listStyleProfiles } from '../styles/index.js';

describe('Platform & Style Profiles (Data Modules)', () => {
  it('retrieves web, android, and flutter platform profiles', () => {
    const web = getPlatformProfile('web');
    const android = getPlatformProfile('android');
    const flutter = getPlatformProfile('flutter');

    expect(web?.id).toBe('web');
    expect(web?.mappings['button']?.componentName).toBe('button');

    expect(android?.id).toBe('android');
    expect(android?.mappings['button']?.componentName).toBe('Button');

    expect(flutter?.id).toBe('flutter');
    expect(flutter?.mappings['button']?.componentName).toBe('ElevatedButton');

    const all = listPlatformProfiles();
    expect(all).toHaveLength(3);
  });

  it('retrieves neubrutalism proof style profile', () => {
    const neubrutalism = getStyleProfile('neubrutalism');
    expect(neubrutalism?.id).toBe('neubrutalism');
    expect(neubrutalism?.borders.radius).toBe(0); // hard 0 radius
    expect(neubrutalism?.borders.width).toBe(3);
    expect(neubrutalism?.shadows.blur).toBe(0); // 0 blur hard shadow
    expect(neubrutalism?.shadows.x).toBe(4);
    expect(neubrutalism?.shadows.y).toBe(4);

    const allStyles = listStyleProfiles();
    expect(allStyles).toHaveLength(19);
  });
});
