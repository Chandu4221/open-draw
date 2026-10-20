export interface InkProps {
  readonly pts: readonly number[];
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly isHighlighter?: boolean;
  readonly label?: string;
}

export const DEFAULT_INK_PROPS: InkProps = {
  pts: [],
  stroke: '#1e293b',
  strokeWidth: 3,
  isHighlighter: false,
};

export const DEFAULT_HIGHLIGHTER_PROPS: InkProps = {
  pts: [],
  stroke: '#fef08a',
  strokeWidth: 20,
  isHighlighter: true,
};
