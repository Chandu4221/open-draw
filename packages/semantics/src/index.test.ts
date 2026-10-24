import { describe, expect, it } from 'vitest';
import {
  getPlatformProfile,
  getSemanticType,
  getStyleProfile,
  listPlatformProfiles,
  listSemanticTypes,
  listStyleProfiles,
  validateSemanticMeta,
} from './index.js';

describe('semantics smoke & unit tests', () => {
  it('retrieves semantic types from vocabulary including row', () => {
    const card = getSemanticType('card');
    expect(card?.id).toBe('card');
    expect(card?.isContainer).toBe(true);

    const row = getSemanticType('row');
    expect(row).toBeDefined();
    expect(row?.isContainer).toBe(true);
    expect(row?.defaultRole).toBe('group');
    expect(row?.allowedParents).toContain('card');
    expect(row?.allowedParents).toContain('section');

    const allTypes = listSemanticTypes();
    expect(allTypes.length).toBeGreaterThanOrEqual(10);
  });

  it('validates semantic metadata objects', () => {
    expect(validateSemanticMeta({ type: 'button', name: 'Submit' })).toBe(true);
    expect(validateSemanticMeta({ type: 123 })).toBe(false);
  });

  it('lists all 19 valid design style profiles with platform-specific filtering', () => {
    const styles = listStyleProfiles();
    expect(styles.length).toBe(19);

    const expectedIds = [
      'neubrutalism', 'material3', 'flat-minimal', 'glassmorphism', 'neumorphism',
      'skeuomorphism', 'claymorphism', 'linear-modern', 'bento-grid', 'aurora-glow',
      'win95-retro', 'cyberpunk', 'synthwave', 'pixel-art', 'swiss-style',
      'raw-brutalism', 'monochrome', 'apple-cupertino', 'fluent2',
    ];
    for (const id of expectedIds) {
      const style = getStyleProfile(id);
      expect(style, `Style profile '${id}' must be registered`).toBeDefined();
      expect(style?.palette.background).toBeTruthy();
      expect(style?.palette.text).toBeTruthy();
      expect(style?.borders.radius).toBeGreaterThanOrEqual(0);
      expect(style?.shadows).toBeDefined();
      expect(style?.typography.baseSize).toBeGreaterThanOrEqual(12);
    }

    // Platform-specific filtering assertions
    const webStyles = listStyleProfiles('web');
    expect(webStyles.length).toBe(19);

    const androidStyles = listStyleProfiles('android');
    expect(androidStyles.length).toBe(9);
    expect(androidStyles.some((s) => s.id === 'material3')).toBe(true);
    expect(androidStyles.some((s) => s.id === 'apple-cupertino')).toBe(false);
    expect(androidStyles.some((s) => s.id === 'win95-retro')).toBe(false);

    const flutterStyles = listStyleProfiles('flutter');
    expect(flutterStyles.length).toBe(10);
    expect(flutterStyles.some((s) => s.id === 'material3')).toBe(true);
    expect(flutterStyles.some((s) => s.id === 'apple-cupertino')).toBe(true);
    expect(flutterStyles.some((s) => s.id === 'bento-grid')).toBe(false);
  });

  it('verifies row platform mapping across all three platforms', () => {
    const platforms = listPlatformProfiles();
    expect(platforms.length).toBe(3);

    const web = getPlatformProfile('web');
    expect(web?.mappings['row']?.componentName).toBe('div');
    expect(web?.mappings['row']?.containerType).toBe('row');

    const android = getPlatformProfile('android');
    expect(android?.mappings['row']?.componentName).toBe('Row');
    expect(android?.mappings['row']?.containerType).toBe('row');

    const flutter = getPlatformProfile('flutter');
    expect(flutter?.mappings['row']?.componentName).toBe('Row');
    expect(flutter?.mappings['row']?.containerType).toBe('row');
  });

  it('registers all 25 canonical semantic types with mappings across all 3 platforms', () => {
    const allTypes = listSemanticTypes();
    expect(allTypes.length).toBe(25);

    const web = getPlatformProfile('web');
    const android = getPlatformProfile('android');
    const flutter = getPlatformProfile('flutter');

    for (const t of allTypes) {
      expect(web?.mappings[t.id], `web mapping missing for ${t.id}`).toBeDefined();
      expect(android?.mappings[t.id], `android mapping missing for ${t.id}`).toBeDefined();
      expect(flutter?.mappings[t.id], `flutter mapping missing for ${t.id}`).toBeDefined();
    }
  });
});

