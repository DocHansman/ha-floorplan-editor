import { useRef } from 'react';
import { Group, Rect, Path } from 'react-konva';
import type Konva from 'konva';
import type { FurnitureElement } from '../types/project';
import { useEditorStore } from '../store/editorStore';
import { getSymbol } from './furniture/furnitureSymbols';

interface Props { el: FurnitureElement; isSelected: boolean; onSelect: (id: string, multi: boolean) => void; }

export function FurnitureShape({ el, isSelected, onSelect }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);
  const sym = getSymbol(el.symbol);

  return (
    <Group ref={groupRef} x={el.x} y={el.y} offsetX={el.width / 2} offsetY={el.height / 2} rotation={el.rotation}
      draggable={activeTool === 'select'} listening={activeTool === 'select'}
      onClick={(e) => { if (activeTool !== 'select') return; e.cancelBubble = true; onSelect(el.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey); }}
      onDragEnd={(e) => { const node = e.target as Konva.Group; updateElement(el.id, { x: el.x + node.x(), y: el.y + node.y() }); node.position({ x: 0, y: 0 }); commitHistory(); }}
      id={el.id}>
      <Rect width={el.width} height={el.height} fill="transparent" stroke={isSelected ? '#60a5fa' : 'transparent'} strokeWidth={1.5} dash={[4, 3]} />
      {sym && <Path data={sym.path} fill="#6b7280" scaleX={el.width / 24} scaleY={el.height / 24} listening={false} opacity={0.85} />}
    </Group>
  );
}
