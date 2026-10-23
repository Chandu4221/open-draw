export interface StyleTokens {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly palette: {
    readonly background: string;
    readonly surface: string;
    readonly border: string;
    readonly primary: string;
    readonly text: string;
    readonly mutedText: string;
  };
  readonly borders: {
    readonly width: number;
    readonly radius: number;
    readonly style: 'solid' | 'dashed';
  };
  readonly shadows: {
    readonly x: number;
    readonly y: number;
    readonly blur: number;
    readonly color: string;
  };
  readonly typography: {
    readonly headingFont: string;
    readonly bodyFont: string;
    readonly baseSize: number;
  };
}
