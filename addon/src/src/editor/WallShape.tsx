import { useRef } from 'react';
import { Line } from 'react-konva';
import type Konva from 'konva';
import type { WallElement } from '../types/project';
import { useEditorStore } from '../store/editorStore';

interface Props { wall: WallElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void; }

export function WallShape({ wall, isSelected, onSelect }: Props) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);
  const lineRef = useRef<Konva.Line>(null);

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target as Konva.Line;
    const dx = node.x(), dy = node.y();
    updateElement(wall.id, { points: wall.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)) });
    node.position({ x: 0, y: 0 }); commitHistory();
  }

  function handleTransformEnd() {
    const node = lineRef.current; if (!node) return;
    const scaleX = node.scaleX(), scaleY = node.scaleY(), dx = node.x(), dy = node.y();
    updateElement(wall.id, { points: wall.points.map((v, i) => i % 2 === 0 ? v * scaleX + dx : v * scaleY + dy) });
    node.scaleX(1); node.scaleY(1); node.position({ x: 0, y: 0 }); commitHistory();
  }

  return (
    <Line ref={lineRef} id={wall.id} points={wall.points} stroke={isSelected ? '#60a5fa' : wall.color} strokeWidth={wall.strokeWidth}
      lineCap="round" lineJoin="round" perfectDrawEnabled={false} hitStrokeWidth={Math.max(wall.strokeWidth, 12)}
      draggable={activeTool === 'select'} listening={activeTool === 'select'}
      onClick={(e) => { if (activeTool !== 'select') return; e.cancelBubble = true; onSelect(wall.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey); }}
      onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd} />
  );
}
