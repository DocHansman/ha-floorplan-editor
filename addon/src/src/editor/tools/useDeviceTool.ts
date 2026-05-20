import { useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import type { DeviceMarker, EntityDomain } from '../../types/project';
import { useEditorStore } from '../../store/editorStore';
import { stageToCanvas } from './snapUtils';

export interface PendingDevice { id: string; x: number; y: number; screenX: number; screenY: number; }

export function useDeviceTool(stageRef: React.RefObject<Konva.Stage | null>, containerRef: React.RefObject<HTMLDivElement | null>) {
  const [pending, setPending] = useState<PendingDevice | null>(null);
  const { activeTool, stageX, stageY, stageScale, addElement, removeElements, updateElement, commitHistory } = useEditorStore();
  const active = activeTool === 'device';

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && pending) { removeElements([pending.id]); setPending(null); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, removeElements]);

  useEffect(() => { if (!active && pending) { removeElements([pending.id]); setPending(null); } }, [active, pending, removeElements]);

  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!active || e.evt.button !== 0 || e.target !== e.target.getStage()) return;
    const stage = stageRef.current, container = containerRef.current;
    if (!stage || !container) return;
    const pos = stage.getPointerPosition(); if (!pos) return;
    const { x, y } = stageToCanvas(pos.x, pos.y, stageX, stageY, stageScale);
    const containerRect = container.getBoundingClientRect();
    const screenX = pos.x * (containerRect.width / stage.width()) + containerRect.left;
    const screenY = pos.y * (containerRect.height / stage.height()) + containerRect.top;
    const id = crypto.randomUUID();
    const placeholder: DeviceMarker = { type: 'device', id, entityId: '', domain: 'light', x, y, showValue: false };
    addElement(placeholder);
    setPending({ id, x, y, screenX, screenY });
  }, [active, stageRef, containerRef, stageX, stageY, stageScale, addElement]);

  const confirmEntity = useCallback((entityId: string, domain: EntityDomain) => {
    if (!pending) return;
    updateElement(pending.id, { entityId, domain });
    commitHistory();
    setPending(null);
  }, [pending, updateElement, commitHistory]);

  const cancelPicker = useCallback(() => {
    if (!pending) return;
    removeElements([pending.id]);
    setPending(null);
  }, [pending, removeElements]);

  const reopenPicker = useCallback((id: string, screenX: number, screenY: number) => {
    const { elements } = useEditorStore.getState();
    const el = elements.find((e) => e.id === id);
    if (!el || el.type !== 'device') return;
    setPending({ id, x: el.x, y: el.y, screenX, screenY });
  }, []);

  return { pending, handleClick, confirmEntity, cancelPicker, reopenPicker };
}
