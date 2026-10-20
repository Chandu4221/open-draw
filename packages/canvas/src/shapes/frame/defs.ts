export interface FrameProps {
  readonly width: number;
  readonly height: number;
  readonly label?: string;
  readonly fill?: string;
  readonly stroke?: string;
}

export const DEFAULT_FRAME_PROPS: FrameProps = {
  width: 400,
  height: 300,
  label: 'Frame',
  fill: '#ffffff',
  stroke: '#cbd5e1',
};
