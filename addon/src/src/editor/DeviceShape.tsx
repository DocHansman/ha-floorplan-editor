import { useRef } from 'react';
import { Group, Circle, Path, Text } from 'react-konva';
import type Konva from 'konva';
import type { DeviceMarker } from '../types/project';
import { useEditorStore } from '../store/editorStore';
import { useEntities } from '../hooks/useEntities';
import { getDomainConfig, isEntityActive, formatSensorValue, entityDomain } from './domain/domainConfig';

const BADGE_R = 22, ICON_SIZE = 18;

interface Props { marker: DeviceMarker; isSelected: boolean; onSelect: (id: string, multi: boolean) => void; onDoubleClick: (id: string, sx: number, sy: number) => void; }

export function DeviceShape({ marker, isSelected, onSelect, onDoubleClick }: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);
  const entities = useEntities();
  const entity = marker.entityId ? entities[marker.entityId] : undefined;
  const dom = marker.entityId ? entityDomain(marker.entityId) : marker.domain;
  const cfg = getDomainConfig(dom);
  const active = entity ? isEntityActive(entity) : false;
  const iconScale = ICON_SIZE / 24;
  const iconOffset = -(ICON_SIZE / 2);
  const sensorText = entity ? formatSensorValue(entity) : null;

  return (
    <Group ref={groupRef} x={marker.x} y={marker.y} draggable={activeTool === 'select'} listening={activeTool === 'select'}
      onClick={(e) => { if (activeTool !== 'select') return; e.cancelBubble = true; onSelect(marker.id, e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey); }}
      onDblClick={(e) => {
        if (activeTool !== 'select') return; e.cancelBubble = true;
        const stage = groupRef.current?.getStage(); if (!stage) return;
        const stageBox = stage.container().getBoundingClientRect();
        const absPos = groupRef.current!.getAbsolutePosition();
        onDoubleClick(marker.id, absPos.x + stageBox.left, absPos.y + stageBox.top);
      }}
      onDragEnd={(e) => { const node = e.target as Konva.Group; updateElement(marker.id, { x: marker.x + node.x(), y: marker.y + node.y() }); node.position({ x: 0, y: 0 }); commitHistory(); }}
      id={marker.id}>
      <Circle radius={BADGE_R} fill="#1e2030" stroke={isSelected ? '#60a5fa' : (active ? cfg.activeColor : 'transparent')} strokeWidth={isSelected ? 2 : 1.5} opacity={0.92} />
      {cfg.icon && <Path data={cfg.icon} fill={active ? cfg.activeColor : cfg.inactiveColor} scaleX={iconScale} scaleY={iconScale} x={iconOffset} y={iconOffset} listening={false} />}
      {(marker.showValue || sensorText) && <Text y={BADGE_R + 4} text={sensorText ?? entity?.state ?? ''} fontSize={10} fill="#9ca3af" align="center" offsetX={0} width={80} x={-40} listening={false} />}
      {marker.label && <Text y={-(BADGE_R + 14)} text={marker.label} fontSize={11} fill="#e5e7eb" align="center" width={80} x={-40} listening={false} />}
      {!marker.entityId && <Circle radius={BADGE_R} stroke="#3b82f6" strokeWidth={1.5} dash={[4, 4]} fill="transparent" listening={false} />}
    </Group>
  );
}
