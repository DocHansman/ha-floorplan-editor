import { useRef, useCallback, useEffect, useState } from 'react';
import { Stage } from 'react-konva';
import type Konva from 'konva';
import { useEditorStore } from '../store/editorStore';
import { GridLayer } from './GridLayer';
import { BackgroundLayer } from './BackgroundLayer';
import { ElementsLayer } from './ElementsLayer';
import { SelectLayer, useStageDeselect } from './SelectLayer';
import { DrawingPreviewLayer } from './DrawingPreviewLayer';
import { EntityPicker } from './EntityPicker';
import { useRoomTool } from './tools/useRoomTool';
import { useWallTool } from './tools/useWallTool';
import { useSelectTool } from './tools/useSelectTool';
import { useDeviceTool } from './tools/useDeviceTool';
import { useFurnitureTool } from './furniture/useFurnitureTool';
import { FurniturePalette } from './FurniturePalette';
import type { EntityDomain } from '../types/project';

const MIN_SCALE = 0.05, MAX_SCALE = 8, ZOOM_FACTOR = 1.12;

interface Props { width: number; height: number; }
interface InlineEdit { id: string; x: number; y: number; value: string; }

export function Canvas({ width, height }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const { elements, backgroundImage, backgroundOpacity, viewBox, stageX, stageY, stageScale, activeTool, selectedIds, showGrid, setViewport, setSelectedIds, updateElement, commitHistory } = useEditorStore();

  const roomTool = useRoomTool(stageRef);
  const wallTool = useWallTool(stageRef);
  useSelectTool();
  const deviceTool = useDeviceTool(stageRef, containerRef);
  const furnitureTool = useFurnitureTool(stageRef);

  useEffect(() => {
    const scaleX = width / viewBox.width, scaleY = height / viewBox.height;
    const scale = Math.min(scaleX, scaleY, 1) * 0.9;
    setViewport((width - viewBox.width * scale) / 2, (height - viewBox.height * scale) / 2, scale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBox.width, viewBox.height]);

  const isPanTool = activeTool === 'pan';
  const isDraggingRef = useRef(false);
  function handleDragMove() { const stage = stageRef.current; if (!stage) return; setViewport(stage.x(), stage.y(), stage.scaleX()); }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current; if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const dir = e.evt.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * (dir > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR)));
    setViewport(pointer.x - mousePointTo.x * newScale, pointer.y - mousePointTo.y * newScale, newScale);
  }

  const lastDist = useRef(0);
  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current; if (!stage) return;
    const touches = e.evt.touches;
    if (touches.length !== 2) return;
    const dx = touches[0].clientX - touches[1].clientX, dy = touches[0].clientY - touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastDist.current === 0) { lastDist.current = dist; return; }
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, stage.scaleX() * (dist / lastDist.current)));
    lastDist.current = dist;
    setViewport(stage.x(), stage.y(), newScale);
  }
  function handleTouchEnd() { lastDist.current = 0; }

  const deselect = useCallback(() => setSelectedIds([]), [setSelectedIds]);
  useStageDeselect(stageRef, deselect, activeTool === 'select');

  function handleSelect(id: string, multi: boolean) {
    if (multi) setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
    else setSelectedIds([id]);
  }

  function handleElementDoubleClick(id: string, screenX?: number, screenY?: number) {
    const el = elements.find((e) => e.id === id); if (!el) return;
    if (el.type === 'room') {
      const stage = stageRef.current, container = containerRef.current;
      if (!stage || !container) return;
      const node = stage.findOne(`#${id}`); if (!node) return;
      const absPos = node.getClientRect({ relativeTo: stage });
      const containerRect = container.getBoundingClientRect();
      setInlineEdit({ id, x: absPos.x + absPos.width / 2 + containerRect.left, y: absPos.y + absPos.height / 2 + containerRect.top, value: el.name });
    }
    if (el.type === 'device' && screenX !== undefined && screenY !== undefined) deviceTool.reopenPicker(id, screenX, screenY);
  }

  function commitInlineEdit() {
    if (!inlineEdit) return;
    updateElement(inlineEdit.id, { name: inlineEdit.value.trim() || 'Room' });
    commitHistory(); setInlineEdit(null);
  }

  const cursor = activeTool === 'pan' ? (isDraggingRef.current ? 'grabbing' : 'grab') :
    ['room', 'wall', 'device', 'furniture'].includes(activeTool) ? 'crosshair' : 'default';

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative" style={{ cursor }}>
      <Stage ref={stageRef} width={width} height={height} x={stageX} y={stageY} scaleX={stageScale} scaleY={stageScale}
        draggable={isPanTool}
        onDragMove={handleDragMove}
        onDragStart={() => { isDraggingRef.current = true; }}
        onDragEnd={() => { isDraggingRef.current = false; handleDragMove(); }}
        onWheel={handleWheel} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (activeTool === 'room') roomTool.handleClick(e);
          if (activeTool === 'wall') wallTool.handleClick(e);
          if (activeTool === 'device') deviceTool.handleClick(e);
          if (activeTool === 'furniture') furnitureTool.handleClick(e);
        }}
        onDblClick={(e) => {
          if (activeTool === 'room') roomTool.handleDblClick(e);
          if (activeTool === 'wall') wallTool.handleDblClick(e);
        }}
        onMouseMove={() => {
          if (activeTool === 'room') roomTool.handleMouseMove();
          if (activeTool === 'wall') wallTool.handleMouseMove();
        }}>
        <BackgroundLayer width={viewBox.width} height={viewBox.height} backgroundImage={backgroundImage} backgroundOpacity={backgroundOpacity} />
        {showGrid && <GridLayer width={viewBox.width} height={viewBox.height} />}
        <ElementsLayer elements={elements} selectedIds={selectedIds} activeTool={activeTool} onSelect={handleSelect} onDoubleClick={handleElementDoubleClick} onElementChange={(id, patch) => updateElement(id, patch)} />
        <DrawingPreviewLayer roomDraft={roomTool.draft} wallDraft={wallTool.draft} stageScale={stageScale} />
        <SelectLayer stageRef={stageRef} selectedIds={selectedIds} onDeselect={deselect} />
      </Stage>
      {deviceTool.pending && <EntityPicker anchorX={deviceTool.pending.screenX} anchorY={deviceTool.pending.screenY} onSelect={(entityId: string, domain: EntityDomain) => deviceTool.confirmEntity(entityId, domain)} onCancel={deviceTool.cancelPicker} />}
      {activeTool === 'furniture' && <FurniturePalette selected={furnitureTool.selectedSymbol} onSelect={furnitureTool.setSelectedSymbol} />}
      {inlineEdit && (
        <input autoFocus value={inlineEdit.value} onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
          onBlur={commitInlineEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
          style={{ position: 'fixed', left: inlineEdit.x, top: inlineEdit.y, transform: 'translate(-50%, -50%)', zIndex: 50 }}
          className="bg-ha-bg border border-ha-accent rounded px-2 py-1 text-sm text-ha-text focus:outline-none text-center min-w-[120px]" />
      )}
    </div>
  );
}
