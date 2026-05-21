import { Layer } from 'react-konva';
import type { FloorPlanElement } from '../types/project';
import type { ToolType } from '../store/editorStore';
import { RoomShape } from './RoomShape';
import { WallShape } from './WallShape';
import { DeviceShape } from './DeviceShape';
import { FurnitureShape } from './FurnitureShape';

interface Props {
  elements: FloorPlanElement[];
  selectedIds: string[];
  activeTool: ToolType;
  onSelect: (id: string, multi: boolean) => void;
  onDoubleClick: (id: string, screenX?: number, screenY?: number) => void;
  onElementChange: (id: string, patch: Partial<FloorPlanElement>) => void;
}

export function ElementsLayer({
  elements,
  selectedIds,
  activeTool: _activeTool,
  onSelect,
  onDoubleClick,
  onElementChange: _onElementChange,
}: Props) {
  return (
    <Layer name="elements">
      {elements.map((el) => {
        if (el.type === 'room') {
          return (
            <RoomShape
              key={el.id}
              room={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={onSelect}
              onDoubleClick={(id) => onDoubleClick(id)}
            />
          );
        }
        if (el.type === 'wall') {
          return (
            <WallShape
              key={el.id}
              wall={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={onSelect}
            />
          );
        }
        if (el.type === 'device') {
          return (
            <DeviceShape
              key={el.id}
              marker={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={onSelect}
              onDoubleClick={(id, sx, sy) => onDoubleClick(id, sx, sy)}
            />
          );
        }
        if (el.type === 'furniture') {
          return (
            <FurnitureShape
              key={el.id}
              el={el}
              isSelected={selectedIds.includes(el.id)}
              onSelect={onSelect}
            />
          );
        }
        return null;
      })}
    </Layer>
  );
}
