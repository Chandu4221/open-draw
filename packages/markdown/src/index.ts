/**
 * @open-draw/markdown
 * Pure annotated-scene → markdown compiler, frozen output.
 */

export interface CompileOptions {
  readonly title?: string;
}

export function compile(scene: unknown, options: CompileOptions = {}): string {
  const header = options.title ? `# ${options.title}\n\n` : '';
  return `${header}<!-- open-draw-spec:v1 -->\n`;
}
