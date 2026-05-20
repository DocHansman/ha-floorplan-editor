import { useRef } from 'react';
import { Group, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { RoomElement } from '../types/project';
import { useEditorStore } from '../store/editorStore';
import { polygonCentroid } from './tools/snapUtils';

interface Props { room: RoomElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void; onDoubleClick: (id: string) => void; }

export function RoomShape({ room, isSelected, onSelect, onDoubleClick }: Props) {
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);
  const groupRef = useRef<Konva.Group>(null);
  const centroid = polygonCentroid(room.points);

  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    onSelect(room.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target as Konva.Group;
    const dx = node.x(), dy = node.y();
    updateElement(room.id, { points: room.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy)) });
    node.position({ x: 0, y: 0 });
    commitHistory();
  }

  function handleTransformEnd() {
    const node = groupRef.current; if (!node) return;
    const scaleX = node.scaleX(), scaleY = node.scaleY(), dx = node.x(), dy = node.y();
    updateElement(room.id, { points: room.points.map((v, i) => i % 2 === 0 ? v * scaleX + dx : v * scaleY + dy) });
    node.scaleX(1); node.scaleY(1); node.position({ x: 0, y: 0 });
    commitHistory();
  }

  return (
    <Group ref={groupRef} draggable={activeTool === 'select'} onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd}
      onClick={handleClick} onDblClick={(e) => { if (activeTool !== 'select') return; e.cancelBubble = true; onDoubleClick(room.id); }} id={room.id}>
      <Line points={room.points} closed fill={room.fillColor} opacity={room.opacity} stroke={isSelected ? '#60a5fa' : room.fillColor} strokeWidth={isSelected ? 2 : 1} perfectDrawEnabled={false} listening={activeTool === 'select'} />
      <Text x={centroid.x} y={centroid.y} text={room.name} fontSize={14} fill="#ffffff" opacity={0.85} offsetX={0} offsetY={7} align="center" listening={false} />
    </Group>
  );
}
