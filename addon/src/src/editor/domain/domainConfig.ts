import { mdiLightbulb, mdiToggleSwitch, mdiFan, mdiThermometer, mdiMotionSensor, mdiThermostat, mdiBlinds, mdiLock, mdiSpeaker, mdiCctv, mdiAccount, mdiFlash, mdiHelp } from '@mdi/js';
import type { EntityDomain } from '../../types/project';
import type { HassEntity } from '../../types/ha';

export interface DomainConfig { label: string; icon: string; activeColor: string; inactiveColor: string; }

export const DOMAIN_CONFIG: Record<EntityDomain, DomainConfig> = {
  light:         { label: 'Light',         icon: mdiLightbulb,    activeColor: '#f59e0b', inactiveColor: '#4b5563' },
  switch:        { label: 'Switch',        icon: mdiToggleSwitch,  activeColor: '#f97316', inactiveColor: '#4b5563' },
  fan:           { label: 'Fan',           icon: mdiFan,           activeColor: '#3b82f6', inactiveColor: '#4b5563' },
  sensor:        { label: 'Sensor',        icon: mdiThermometer,   activeColor: '#9ca3af', inactiveColor: '#4b5563' },
  binary_sensor: { label: 'Binary Sensor', icon: mdiMotionSensor,  activeColor: '#a855f7', inactiveColor: '#4b5563' },
  climate:       { label: 'Climate',       icon: mdiThermostat,    activeColor: '#ef4444', inactiveColor: '#4b5563' },
  cover:         { label: 'Cover',         icon: mdiBlinds,        activeColor: '#d97706', inactiveColor: '#4b5563' },
  lock:          { label: 'Lock',          icon: mdiLock,          activeColor: '#22c55e', inactiveColor: '#4b5563' },
  media_player:  { label: 'Media',         icon: mdiSpeaker,       activeColor: '#6366f1', inactiveColor: '#4b5563' },
  camera:        { label: 'Camera',        icon: mdiCctv,          activeColor: '#6b7280', inactiveColor: '#4b5563' },
  person:        { label: 'Person',        icon: mdiAccount,       activeColor: '#06b6d4', inactiveColor: '#4b5563' },
};

export const FALLBACK_DOMAIN_CONFIG: DomainConfig = { label: 'Other', icon: mdiFlash, activeColor: '#9ca3af', inactiveColor: '#4b5563' };
export function getDomainConfig(domain: string): DomainConfig { return DOMAIN_CONFIG[domain as EntityDomain] ?? FALLBACK_DOMAIN_CONFIG; }
export function entityDomain(entityId: string): string { return entityId.split('.')[0]; }
export function isEntityActive(entity: HassEntity): boolean {
  const s = entity.state;
  if (s === 'on' || s === 'open' || s === 'unlocked' || s === 'home' || s === 'playing') return true;
  if (!isNaN(Number(s))) return true;
  return false;
}
export function formatSensorValue(entity: HassEntity): string | null {
  if (entityDomain(entity.entity_id) !== 'sensor') return null;
  const unit = entity.attributes['unit_of_measurement'] as string | undefined;
  return unit ? `${entity.state}${unit}` : entity.state;
}
export const HELP_ICON = mdiHelp;
