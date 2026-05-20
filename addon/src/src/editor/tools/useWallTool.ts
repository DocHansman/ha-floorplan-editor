import { useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import type { WallElement } from '../../types/project';
import { useEditorStore } from '../../store/editorStore';
import { snapPoint, stageToCanvas } from './snapUtils';

export interface DraftWall { points: number[]; cursorX: number; cursorY: number; }

export function useWallTool(stageRef: React.RefObject<Konva.Stage | null>) {
  const [draft, setDraft] = useState<DraftWall | null>(null);
  const { activeTool, elements, showGrid, stageX, stageY, stageScale, addElement, commitHistory } = useEditorStore();
  const active = activeTool === 'wall';

  useEffect(() => { function onKey(e: KeyboardEvent) { if (!active) return; if (e.key === 'Escape') setDraft(null); } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [active]);
  useEffect(() => { if (!active) setDraft(null); }, [active]);

  const getSnapped = useCallback((extraPts?: number[]) => {
    const stage = stageRef.current; if (!stage) return null;
    const pos = stage.getPointerPosition(); if (!pos) return null;
    const { x, y } = stageToCanvas(pos.x, pos.y, stageX, stageY, stageScale);
    return snapPoint(x, y, elements, showGrid, stageScale, extraPts);
  }, [stageRef, stageX, stageY, stageScale, elements, showGrid]);

  const handleMouseMove = useCallback(() => {
    if (!active || !draft) return;
    const snapped = getSnapped(draft.points);
    if (!snapped) return;
    setDraft((d) => d && { ...d, cursorX: snapped.x, cursorY: snapped.y });
  }, [active, draft, getSnapped]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || e.evt.button !== 0 || e.target !== e.target.getStage()) return;
    const snapped = getSnapped(draft?.points);
    if (!snapped) return;
    if (!draft) { setDraft({ points: [snapped.x, snapped.y], cursorX: snapped.x, cursorY: snapped.y }); return; }
    setDraft((d) => d && { points: [...d.points, snapped.x, snapped.y], cursorX: snapped.x, cursorY: snapped.y });
  }, [active, draft, getSnapped]);

  const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || !draft || e.target !== e.target.getStage()) return;
    const pts = draft.points;
    const trimmed = pts.slice(0, -2);
    const final = trimmed.length >= 4 ? trimmed : pts;
    if (final.length >= 4) { addElement({ type: 'wall', id: crypto.randomUUID(), points: final, strokeWidth: 3, color: '#94a3b8' }); commitHistory(); }
    setDraft(null);
  }, [active, draft, addElement, commitHistory]);

  return { draft, handleClick, handleDblClick, handleMouseMove };
}
