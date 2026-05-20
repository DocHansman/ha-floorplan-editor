export function polygonCentroid(points: number[]): { x: number; y: number } {
  const n = points.length / 2;
  if (n === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0;
  for (let i = 0; i < points.length; i += 2) { cx += points[i]; cy += points[i + 1]; }
  return { x: cx / n, y: cy / n };
}

export function toSvgPoints(points: number[]): string {
  const pairs: string[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) pairs.push(`${points[i]},${points[i + 1]}`);
  return pairs.join(' ');
}
