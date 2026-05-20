import type { DeviceMarker, HassStates, HomeAssistant } from '../shared/types';
import { getDomainConfig, entityDomain, isEntityActive, formatSensorValue, TOGGLEABLE } from '../shared/domainConfig';

const BADGE_R = 22, ICON_SIZE = 18, ICON_SCALE = ICON_SIZE / 24, ICON_OFFSET = -(ICON_SIZE / 2);

interface Props { marker: DeviceMarker; states: HassStates; hass: HomeAssistant; }

export function DeviceBadge({ marker, states, hass }: Props) {
  const entity = marker.entityId ? states[marker.entityId] : undefined;
  const dom = marker.entityId ? entityDomain(marker.entityId) : marker.domain;
  const cfg = getDomainConfig(dom);
  const active = entity ? isEntityActive(entity) : false;
  const sensorText = entity ? formatSensorValue(entity) : null;
  const displayText = marker.showValue ? (sensorText ?? entity?.state ?? '') : null;
  const isClickable = marker.entityId && TOGGLEABLE.has(dom);

  function handleClick() {
    if (!marker.entityId || !TOGGLEABLE.has(dom)) return;
    const service = dom === 'cover' ? (active ? 'close_cover' : 'open_cover') : dom === 'lock' ? (active ? 'lock' : 'unlock') : 'toggle';
    hass.callService(dom, service, { entity_id: marker.entityId });
  }

  return (
    <g transform={`translate(${marker.x},${marker.y})`} onClick={isClickable ? handleClick : undefined} style={{ cursor: isClickable ? 'pointer' : 'default' }}>
      <circle r={BADGE_R} fill="#1e2030" stroke={active ? cfg.activeColor : 'transparent'} strokeWidth={1.5} opacity={0.92} style={{ transition: 'stroke 0.3s ease' }} />
      {cfg.icon && <path d={cfg.icon} fill={active ? cfg.activeColor : cfg.inactiveColor} transform={`scale(${ICON_SCALE}) translate(${ICON_OFFSET / ICON_SCALE},${ICON_OFFSET / ICON_SCALE})`} style={{ transition: 'fill 0.3s ease', pointerEvents: 'none' }} />}
      {displayText && <text y={BADGE_R + 13} textAnchor="middle" fill="#9ca3af" fontSize={10} style={{ pointerEvents: 'none', userSelect: 'none' }}>{displayText}</text>}
      {marker.label && <text y={-(BADGE_R + 6)} textAnchor="middle" fill="#e5e7eb" fontSize={11} style={{ pointerEvents: 'none', userSelect: 'none' }}>{marker.label}</text>}
    </g>
  );
}
