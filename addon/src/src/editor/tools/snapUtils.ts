import type { FloorPlanElement } from '../../types/project';

export const GRID_SIZE = 40;
// Snap radius in screen pixels (converted to canvas coords at call site)
const SNAP_SCREEN_PX = 12;

export interface SnapResult {
  x: number;
  y: number;
  snappedToPoint: boolean;
}

function getElementPoints(el: FloorPlanElement): number[] {
  if (el.type === 'room' || el.type === 'wall') return el.points;
  return [];
}

/**
 * Snap a canvas-space point to:
 * 1. Existing element vertices (priority, within SNAP_SCREEN_PX screen pixels)
 * 2. Grid (if gridOn)
 */
export function snapPoint(
  x: number,
  y: number,
  elements: FloorPlanElement[],
  gridOn: boolean,
  stageScale: number,
  // Extra points to also snap to (e.g. the current draft polygon's own vertices)
  extraPoints?: number[],
): SnapResult {
  const snapRadius = SNAP_SCREEN_PX / stageScale;

  let nearest = Infinity;
  let snappedX = x;
  let snappedY = y;

  const allPointArrays = [
    ...elements.map(getElementPoints),
    extraPoints ?? [],
  ];

  for (const pts of allPointArrays) {
    for (let i = 0; i + 1 < pts.length; i += 2) {
      const dx = pts[i] - x;
      const dy = pts[i + 1] - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < snapRadius && d < nearest) {
        nearest = d;
        snappedX = pts[i];
        snappedY = pts[i + 1];
      }
    }
  }

  if (nearest < snapRadius) {
    return { x: snappedX, y: snappedY, snappedToPoint: true };
  }

  if (gridOn) {
    return {
      x: Math.round(x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(y / GRID_SIZE) * GRID_SIZE,
      snappedToPoint: false,
    };
  }

  return { x, y, snappedToPoint: false };
}

/** Convert a Konva stage pointer position to canvas (content) coordinates. */
export function stageToCanvas(
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  stageScale: number,
): { x: number; y: number } {
  return {
    x: (screenX - stageX) / stageScale,
    y: (screenY - stageY) / stageScale,
  };
}

/** Compute the centroid (average) of a flat [x,y,x,y,...] points array. */
export function polygonCentroid(points: number[]): { x: number; y: number } {
  const n = points.length / 2;
  if (n === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 2) {
    cx += points[i];
    cy += points[i + 1];
  }
  return { x: cx / n, y: cy / n };
}
