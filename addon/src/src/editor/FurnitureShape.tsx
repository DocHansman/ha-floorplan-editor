import { useRef } from 'react';
import { Group, Rect, Path } from 'react-konva';
import type Konva from 'konva';
import type { FurnitureElement } from '../types/project';
import { useEditorStore } from '../store/editorStore';
import { getSymbol } from './furniture/furnitureSymbols';

interface Props {
  el: FurnitureElement;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}

export function FurnitureShape({ el, isSelected, onSelect }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);

  const sym = getSymbol(el.symbol);
  // Scale MDI path (24×24) to fill el.width × el.height
  const scaleX = el.width / 24;
  const scaleY = el.height / 24;

  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    onSelect(el.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target as Konva.Group;
    const newX = node.x();
    const newY = node.y();
    node.position({ x: el.x, y: el.y });
    updateElement(el.id, { x: newX, y: newY });
    commitHistory();
  }

  return (
    <Group
      ref={groupRef}
      x={el.x}
      y={el.y}
      offsetX={el.width / 2}
      offsetY={el.height / 2}
      rotation={el.rotation}
      draggable={activeTool === 'select'}
      listening={activeTool === 'select'}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
      id={el.id}
    >
      {/* Hit area */}
      <Rect
        width={el.width}
        height={el.height}
        fill="transparent"
        stroke={isSelected ? '#60a5fa' : 'transparent'}
        strokeWidth={1.5}
        dash={[4, 3]}
      />

      {/* Symbol icon */}
      {sym && (
        <Path
          data={sym.path}
          fill="#6b7280"
          scaleX={scaleX}
          scaleY={scaleY}
          listening={false}
          opacity={0.85}
        />
      )}
    </Group>
  );
}
