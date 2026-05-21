import { useRef } from 'react';
import { Group, Circle, Path, Text } from 'react-konva';
import type Konva from 'konva';
import type { DeviceMarker } from '../types/project';
import { useEditorStore } from '../store/editorStore';
import { useEntities } from '../hooks/useEntities';
import {
  getDomainConfig,
  isEntityActive,
  formatSensorValue,
  entityDomain,
} from './domain/domainConfig';

const BADGE_R = 22;
const ICON_SIZE = 18; // rendered inside a 24×24 viewBox → scale factor = ICON_SIZE/24

interface Props {
  marker: DeviceMarker;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onDoubleClick: (id: string, screenX: number, screenY: number) => void;
}

export function DeviceShape({ marker, isSelected, onSelect, onDoubleClick }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);

  const entities = useEntities();
  const entity = marker.entityId ? entities[marker.entityId] : undefined;

  const dom = marker.entityId
    ? entityDomain(marker.entityId)
    : marker.domain;
  const cfg = getDomainConfig(dom);

  const active = entity ? isEntityActive(entity) : false;
  const iconColor = active ? cfg.activeColor : cfg.inactiveColor;
  const sensorText = entity ? formatSensorValue(entity) : null;

  // Scale MDI path (viewBox=0 0 24 24) to ICON_SIZE
  const iconScale = ICON_SIZE / 24;
  const iconOffset = -(ICON_SIZE / 2); // center the icon

  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    onSelect(marker.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey);
  }

  function handleDblClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (activeTool !== 'select') return;
    e.cancelBubble = true;
    // Convert stage position to screen coords for picker anchoring
    const stage = groupRef.current?.getStage();
    if (!stage) return;
    const stageBox = stage.container().getBoundingClientRect();
    const absPos = groupRef.current!.getAbsolutePosition();
    const screenX = absPos.x + stageBox.left;
    const screenY = absPos.y + stageBox.top;
    onDoubleClick(marker.id, screenX, screenY);
  }

  function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target as Konva.Group;
    const newX = node.x();
    const newY = node.y();
    node.position({ x: marker.x, y: marker.y }); // reset before React re-render
    updateElement(marker.id, { x: newX, y: newY });
    commitHistory();
  }

  return (
    <Group
      ref={groupRef}
      x={marker.x}
      y={marker.y}
      draggable={activeTool === 'select'}
      listening={activeTool === 'select'}
      onClick={handleClick}
      onDblClick={handleDblClick}
      onDragEnd={handleDragEnd}
      id={marker.id}
    >
      {/* Badge background circle */}
      <Circle
        radius={BADGE_R}
        fill="#1e2030"
        stroke={isSelected ? '#60a5fa' : (active ? cfg.activeColor : 'transparent')}
        strokeWidth={isSelected ? 2 : 1.5}
        opacity={isSelected ? 1 : 0.92}
      />

      {/* MDI icon as scaled SVG path */}
      {cfg.icon && (
        <Path
          data={cfg.icon}
          fill={iconColor}
          scaleX={iconScale}
          scaleY={iconScale}
          x={iconOffset}
          y={iconOffset}
          listening={false}
        />
      )}

      {/* Sensor value / state text below badge */}
      {(marker.showValue || sensorText) && (
        <Text
          y={BADGE_R + 4}
          text={sensorText ?? entity?.state ?? ''}
          fontSize={10}
          fill="#9ca3af"
          align="center"
          offsetX={0}
          width={80}
          x={-40}
          listening={false}
        />
      )}

      {/* Optional custom label above badge */}
      {marker.label && (
        <Text
          y={-(BADGE_R + 14)}
          text={marker.label}
          fontSize={11}
          fill="#e5e7eb"
          align="center"
          width={80}
          x={-40}
          listening={false}
        />
      )}

      {/* Placeholder ring when entity not yet assigned */}
      {!marker.entityId && (
        <Circle
          radius={BADGE_R}
          stroke="#3b82f6"
          strokeWidth={1.5}
          dash={[4, 4]}
          fill="transparent"
          listening={false}
        />
      )}
    </Group>
  );
}
