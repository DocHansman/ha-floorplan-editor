import type { HassStates, LovelaceCardConfig } from '../shared/types';
import { isEntityActive } from '../shared/domainConfig';

interface Props { states: HassStates; summary: LovelaceCardConfig['summary']; accentColor: string; }

function parseEntityList(spec: string | undefined): string[] {
  if (!spec) return [];
  return spec.split(',').map((s) => s.trim()).filter(Boolean);
}

export function SummaryBar({ states, summary, accentColor }: Props) {
  if (!summary) return null;
  const lightIds = parseEntityList(summary.lights);
  const windowIds = parseEntityList(summary.windows);
  const lightsOn = lightIds.filter((id) => { const e = states[id]; return e ? isEntityActive(e) : false; }).length;
  const windowsOpen = windowIds.filter((id) => { const e = states[id]; return e ? isEntityActive(e) : false; }).length;
  const tempEntity = summary.temperature ? states[summary.temperature] : undefined;
  const tempValue = tempEntity ? `Ø ${tempEntity.state}${(tempEntity.attributes['unit_of_measurement'] as string | undefined) ?? '°C'}` : null;
  const parts: string[] = [];
  if (lightIds.length > 0) parts.push(`${lightsOn}/${lightIds.length} Lights`);
  if (windowIds.length > 0 && windowsOpen > 0) parts.push(`${windowsOpen} Window${windowsOpen !== 1 ? 's' : ''} open`);
  if (tempValue) parts.push(tempValue);
  if (parts.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '6px 12px', background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${accentColor}33`, fontSize: '12px', color: '#9ca3af', flexWrap: 'wrap' }}>
      {parts.map((p) => <span key={p} style={{ color: '#e5e7eb' }}>{p}</span>)}
    </div>
  );
}
