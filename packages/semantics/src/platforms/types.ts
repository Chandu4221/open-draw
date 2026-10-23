export interface PlatformComponentMapping {
  readonly componentName: string;
  readonly importSource?: string;
  readonly containerType?: 'flex' | 'column' | 'row' | 'stack' | 'grid';
  readonly notes?: string;
}

export interface PlatformProfile {
  readonly id: 'web' | 'android' | 'flutter' | string;
  readonly label: string;
  readonly target: string;
  readonly mappings: Readonly<Record<string, PlatformComponentMapping>>;
}
