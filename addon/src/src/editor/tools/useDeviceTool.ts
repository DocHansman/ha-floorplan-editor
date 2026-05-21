import { useState, useEffect, useCallback } from 'react';
import type Konva from 'konva';
import type { DeviceMarker, EntityDomain } from '../../types/project';
import { useEditorStore } from '../../store/editorStore';
import { stageToCanvas } from './snapUtils';

export interface PendingDevice {
  /** Temporary ID — same one used in the store until confirmed or cancelled */
  id: string;
  /** Canvas coordinates */
  x: number;
  y: number;
  /** Screen coordinates for picker positioning */
  screenX: number;
  screenY: number;
}

export function useDeviceTool(
  stageRef: React.RefObject<Konva.Stage | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [pending, setPending] = useState<PendingDevice | null>(null);

  const {
    activeTool,
    stageX,
    stageY,
    stageScale,
    addElement,
    removeElements,
    updateElement,
    commitHistory,
  } = useEditorStore();

  const active = activeTool === 'device';

  // Cancel pending on Escape or tool switch
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && pending) {
        removeElements([pending.id]);
        setPending(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, removeElements]);

  useEffect(() => {
    if (!active && pending) {
      removeElements([pending.id]);
      setPending(null);
    }
  }, [active, pending, removeElements]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!active) return;
      if (e.evt.button !== 0) return;
      if (e.target !== e.target.getStage()) return;

      const stage = stageRef.current;
      const container = containerRef.current;
      if (!stage || !container) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const { x, y } = stageToCanvas(pos.x, pos.y, stageX, stageY, stageScale);

      // Screen position for picker
      const containerRect = container.getBoundingClientRect();
      const screenX = pos.x * (containerRect.width / stage.width()) + containerRect.left;
      const screenY = pos.y * (containerRect.height / stage.height()) + containerRect.top;

      const id = crypto.randomUUID();

      // Add a placeholder marker immediately (entity will be filled in by picker)
      const placeholder: DeviceMarker = {
        type: 'device',
        id,
        entityId: '',
        domain: 'light',
        x,
        y,
        showValue: false,
      };
      addElement(placeholder);
      setPending({ id, x, y, screenX, screenY });
    },
    [active, stageRef, containerRef, stageX, stageY, stageScale, addElement],
  );

  /** Called when user picks an entity in the picker */
  const confirmEntity = useCallback(
    (entityId: string, domain: EntityDomain) => {
      if (!pending) return;
      updateElement(pending.id, { entityId, domain });
      commitHistory();
      setPending(null);
    },
    [pending, updateElement, commitHistory],
  );

  /** Called when user dismisses the picker without picking */
  const cancelPicker = useCallback(() => {
    if (!pending) return;
    removeElements([pending.id]);
    setPending(null);
  }, [pending, removeElements]);

  /** Re-open picker for an already-placed device (double-click) */
  const reopenPicker = useCallback(
    (id: string, screenX: number, screenY: number) => {
      const { elements } = useEditorStore.getState();
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== 'device') return;
      // Use the same pending state — but don't add a new element
      setPending({ id, x: el.x, y: el.y, screenX, screenY });
    },
    [],
  );

  return { pending, handleClick, confirmEntity, cancelPicker, reopenPicker };
}
