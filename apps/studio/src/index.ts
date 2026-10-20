/**
 * @open-draw/studio
 * OpenDraw Studio — thin React composition shell.
 */

export interface StudioAppConfig {
  readonly title: string;
}

export function createStudioConfig(title = 'OpenDraw Studio'): StudioAppConfig {
  return { title };
}
