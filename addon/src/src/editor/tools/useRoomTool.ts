import { useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import type { RoomElement } from '../../types/project';
import { useEditorStore } from '../../store/editorStore';
import { snapPoint, stageToCanvas } from './snapUtils';

export const DEFAULT_ROOM_COLORS = [
  '#0d9488', // teal
  '#3b82f6', // blue
  '#7c3aed', // purple
  '#d97706', // amber
  '#16a34a', // green
  '#dc2626', // red
  '#92400e', // brown
  '#6b7280', // gray
];

export interface DraftRoom {
  points: number[];        // flat [x,y,x,y,...] committed vertices
  cursorX: number;         // current mouse position (canvas coords)
  cursorY: number;
}

export function useRoomTool(stageRef: React.RefObject<Konva.Stage | null>) {
  const [draft, setDraft] = useState<DraftRoom | null>(null);
  const [nextColor, setNextColor] = useState(0);

  const {
    activeTool,
    elements,
    showGrid,
    stageX,
    stageY,
    stageScale,
    addElement,
    commitHistory,
  } = useEditorStore();

  const active = activeTool === 'room';

  // Cancel on Escape or tool switch
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!active) return;
      if (e.key === 'Escape') setDraft(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  useEffect(() => {
    if (!active) setDraft(null);
  }, [active]);

  const getSnappedCanvasPos = useCallback(
    (draftPoints?: number[]) => {
      const stage = stageRef.current;
      if (!stage) return null;
      const pos = stage.getPointerPosition();
      if (!pos) return null;
      const { x, y } = stageToCanvas(pos.x, pos.y, stageX, stageY, stageScale);
      return snapPoint(x, y, elements, showGrid, stageScale, draftPoints);
    },
    [stageRef, stageX, stageY, stageScale, elements, showGrid],
  );

  /** Called from stage onMouseMove */
  const handleMouseMove = useCallback(() => {
    if (!active || !draft) return;
    const snapped = getSnappedCanvasPos(draft.points);
    if (!snapped) return;
    setDraft((d) => d && { ...d, cursorX: snapped.x, cursorY: snapped.y });
  }, [active, draft, getSnappedCanvasPos]);

  /** Called from stage onClick */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!active) return;
      // Ignore right-click
      if (e.evt.button !== 0) return;
      // Ignore clicks on shapes (handled by shape's own handler)
      if (e.target !== e.target.getStage()) return;

      const snapped = getSnappedCanvasPos(draft?.points);
      if (!snapped) return;

      if (!draft) {
        // Start new polygon
        setDraft({
          points: [snapped.x, snapped.y],
          cursorX: snapped.x,
          cursorY: snapped.y,
        });
        return;
      }

      const pts = draft.points;

      // Close if clicking near start point (>= 3 vertices already)
      if (pts.length >= 6) {
        const dx = snapped.x - pts[0];
        const dy = snapped.y - pts[1];
        if (Math.sqrt(dx * dx + dy * dy) < 16 / stageScale) {
          finishRoom(pts);
          return;
        }
      }

      // Append vertex
      setDraft({
        points: [...pts, snapped.x, snapped.y],
        cursorX: snapped.x,
        cursorY: snapped.y,
      });
    },
    [active, draft, getSnappedCanvasPos, stageScale],
  );

  /** Dblclick = close polygon */
  const handleDblClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!active || !draft) return;
      if (e.target !== e.target.getStage()) return;
      const pts = draft.points;
      if (pts.length >= 6) {
        // Remove the last vertex that was added by the first click of the dblclick
        const trimmed = pts.slice(0, -2);
        finishRoom(trimmed.length >= 6 ? trimmed : pts);
      }
    },
    [active, draft],
  );

  function finishRoom(pts: number[]) {
    if (pts.length < 6) {
      setDraft(null);
      return;
    }
    const colorIdx = nextColor % DEFAULT_ROOM_COLORS.length;
    const room: RoomElement = {
      type: 'room',
      id: crypto.randomUUID(),
      name: 'Room',
      points: pts,
      fillColor: DEFAULT_ROOM_COLORS[colorIdx],
      opacity: 0.6,
    };
    addElement(room);
    commitHistory();
    setNextColor((n) => n + 1);
    setDraft(null);
  }

  return { draft, handleClick, handleDblClick, handleMouseMove };
}
