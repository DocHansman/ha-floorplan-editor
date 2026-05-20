import { useState, useRef, useEffect, useMemo } from 'react';
import { useEntities } from '../hooks/useEntities';
import { getDomainConfig, entityDomain } from './domain/domainConfig';
import type { EntityDomain } from '../types/project';

const FILTER_DOMAINS: Array<EntityDomain | 'all'> = ['all', 'light', 'switch', 'sensor', 'binary_sensor', 'climate', 'fan', 'cover', 'lock', 'media_player', 'camera'];

interface Props { anchorX: number; anchorY: number; onSelect: (entityId: string, domain: EntityDomain) => void; onCancel: () => void; }

function fuzzyMatch(query: string, text: string): boolean { if (!query) return true; return text.toLowerCase().includes(query.toLowerCase()); }

export function EntityPicker({ anchorX, anchorY, onSelect, onCancel }: Props) {
  const entities = useEntities();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<EntityDomain | 'all'>('all');
  const searchRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { searchRef.current?.focus(); }, []);
  useEffect(() => { function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel(); } window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onCancel]);
  useEffect(() => {
    function onPointer(e: PointerEvent) { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) onCancel(); }
    const id = setTimeout(() => window.addEventListener('pointerdown', onPointer), 50);
    return () => { clearTimeout(id); window.removeEventListener('pointerdown', onPointer); };
  }, [onCancel]);

  const filtered = useMemo(() => Object.values(entities).filter((e) => {
    const dom = entityDomain(e.entity_id);
    if (activeTab !== 'all' && dom !== activeTab) return false;
    if (!fuzzyMatch(search, e.entity_id) && !fuzzyMatch(search, (e.attributes['friendly_name'] as string | undefined) ?? '')) return false;
    return true;
  }).slice(0, 80), [entities, activeTab, search]);

  const style = useMemo(() => {
    const W = 320, H = 420, margin = 8;
    let left = anchorX + 12, top = anchorY - 40;
    if (left + W > window.innerWidth - margin) left = anchorX - W - 12;
    if (top + H > window.innerHeight - margin) top = window.innerHeight - H - margin;
    if (top < margin) top = margin;
    return { left, top, width: W, height: H };
  }, [anchorX, anchorY]);

  return (
    <div ref={pickerRef} style={{ position: 'fixed', zIndex: 200, ...style }} className="bg-ha-surface border border-ha-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
      <div className="p-2 border-b border-ha-border flex items-center gap-2">
        <input ref={searchRef} type="search" placeholder="Search entities…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-ha-bg border border-ha-border rounded px-2 py-1 text-xs text-ha-text placeholder:text-ha-muted focus:outline-none focus:border-ha-accent" />
        <button onClick={onCancel} className="text-ha-muted hover:text-ha-text text-xs px-1">✕</button>
      </div>
      <div className="flex gap-0 overflow-x-auto border-b border-ha-border shrink-0" style={{ scrollbarWidth: 'none' }}>
        {FILTER_DOMAINS.map((dom) => {
          const cfg = dom === 'all' ? null : getDomainConfig(dom);
          return (
            <button key={dom} onClick={() => setActiveTab(dom)} className={`shrink-0 px-2 py-1.5 text-xs transition-colors ${
              activeTab === dom ? 'text-ha-accent border-b-2 border-ha-accent' : 'text-ha-muted hover:text-ha-text'
            }`}>{dom === 'all' ? 'All' : cfg!.label}</button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && <p className="p-3 text-ha-muted text-xs">No entities found.</p>}
        {filtered.map((entity) => {
          const dom = entityDomain(entity.entity_id);
          const cfg = getDomainConfig(dom);
          const name = (entity.attributes['friendly_name'] as string | undefined) ?? entity.entity_id;
          return (
            <button key={entity.entity_id} onClick={() => onSelect(entity.entity_id, dom as EntityDomain)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ha-border/40 text-left">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.activeColor }} />
              <div className="min-w-0 flex-1">
                <p className="text-ha-text text-xs truncate">{name}</p>
                <p className="text-ha-muted text-xs font-mono truncate">{entity.entity_id}</p>
              </div>
              <span className="text-ha-muted text-xs shrink-0 bg-ha-border/60 px-1 py-0.5 rounded font-mono">{entity.state}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
