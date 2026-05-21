import { Layer, Line } from 'react-konva';

interface Props {
  width: number;
  height: number;
  gridSize?: number;
}

export function GridLayer({ width, height, gridSize = 40 }: Props) {
  const lines: React.ReactElement[] = [];

  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke="#374151"
        strokeWidth={0.5}
        listening={false}
      />,
    );
  }
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke="#374151"
        strokeWidth={0.5}
        listening={false}
      />,
    );
  }

  return <Layer listening={false}>{lines}</Layer>;
}
