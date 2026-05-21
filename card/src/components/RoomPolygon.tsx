import type { RoomElement, HassStates, DeviceMarker } from '../shared/types';
import { isEntityActive } from '../shared/domainConfig';
import { polygonCentroid, toSvgPoints } from '../shared/geometry';

interface Props {
  room: RoomElement;
  devices: DeviceMarker[];   // devices inside this room (for dim logic)
  states: HassStates;
  showLabels: boolean;
  dimInactive: boolean;
  accentColor: string;
}

export function RoomPolygon({
  room,
  devices,
  states,
  showLabels,
  dimInactive,
  accentColor: _accentColor,
}: Props) {
  const centroid = polygonCentroid(room.points);

  // A room is "active" if any of its devices are on
  const roomActive = devices.some((d) => {
    const entity = d.entityId ? states[d.entityId] : undefined;
    return entity ? isEntityActive(entity) : false;
  });

  const opacity = dimInactive && !roomActive && devices.length > 0
    ? room.opacity * 0.35
    : room.opacity;

  return (
    <g>
      <polygon
        points={toSvgPoints(room.points)}
        fill={room.fillColor}
        opacity={opacity}
        style={{ transition: 'opacity 0.4s ease' }}
      />
      {showLabels && (
        <text
          x={centroid.x}
          y={centroid.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={14}
          opacity={0.85}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {room.name}
        </text>
      )}
    </g>
  );
}
