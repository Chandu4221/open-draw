function perpendicularDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  return Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / Math.sqrt(lenSq);
}

export function simplifyRDP(points: readonly number[], epsilon: number = 1.5): number[] {
  const count = Math.floor(points.length / 2);
  if (count <= 2) {
    return Array.from(points);
  }

  const x1 = points[0]!;
  const y1 = points[1]!;
  const x2 = points[(count - 1) * 2]!;
  const y2 = points[(count - 1) * 2 + 1]!;

  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < count - 1; i++) {
    const px = points[i * 2]!;
    const py = points[i * 2 + 1]!;
    const dist = perpendicularDistance(px, py, x1, y1, x2, y2);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyRDP(points.slice(0, (maxIndex + 1) * 2), epsilon);
    const right = simplifyRDP(points.slice(maxIndex * 2), epsilon);
    return left.slice(0, -2).concat(right);
  }

  return [x1, y1, x2, y2];
}
