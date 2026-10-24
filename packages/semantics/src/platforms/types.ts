export interface PlatformComponentMapping {
  readonly componentName: string;
  readonly importSource?: string;
  readonly containerType?: 'flex' | 'column' | 'row' | 'stack' | 'grid' | string;
  readonly notes?: string;
}

export interface BreakpointProfile {
  readonly id: string;
  readonly label: string;
  readonly width: number;
}

export interface PlatformProfile {
  readonly id: 'web' | 'android' | 'flutter' | string;
  readonly label: string;
  readonly target: string;
  readonly breakpoints?: readonly BreakpointProfile[];
  readonly mappings: Readonly<Record<string, PlatformComponentMapping>>;
}
