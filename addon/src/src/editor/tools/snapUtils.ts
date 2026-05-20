import type { FloorPlanElement } from '../../types/project';

export const GRID_SIZE = 40;
const SNAP_SCREEN_PX = 12;

export interface SnapResult { x: number; y: number; snappedToPoint: boolean; }

function getElementPoints(el: FloorPlanElement): number[] {
  if (el.type === 'room' || el.type === 'wall') return el.points;
  return [];
}

export function snapPoint(x: number, y: number, elements: FloorPlanElement[], gridOn: boolean, stageScale: number, extraPoints?: number[]): SnapResult {
  const snapRadius = SNAP_SCREEN_PX / stageScale;
  let nearest = Infinity, snappedX = x, snappedY = y;
  const allPointArrays = [...elements.map(getElementPoints), extraPoints ?? []];
  for (const pts of allPointArrays) {
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const dx = pts[i] - x, dy = pts[i + 1] - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < snapRadius && d < nearest) { nearest = d; snappedX = pts[i]; snappedY = pts[i + 1]; }
    }
  }
  if (nearest < snapRadius) return { x: snappedX, y: snappedY, snappedToPoint: true };
  if (gridOn) return { x: Math.round(x / GRID_SIZE) * GRID_SIZE, y: Math.round(y / GRID_SIZE) * GRID_SIZE, snappedToPoint: false };
  return { x, y, snappedToPoint: false };
}

export function stageToCanvas(screenX: number, screenY: number, stageX: number, stageY: number, stageScale: number): { x: number; y: number } {
  return { x: (screenX - stageX) / stageScale, y: (screenY - stageY) / stageScale };
}

export function polygonCentroid(points: number[]): { x: number; y: number } {
  const n = points.length / 2;
  if (n === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0;
  for (let i = 0; i < points.length; i += 2) { cx += points[i]; cy += points[i + 1]; }
  return { x: cx / n, y: cy / n };
}
