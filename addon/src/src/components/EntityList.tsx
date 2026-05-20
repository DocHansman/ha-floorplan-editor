import { useMemo, useState } from 'react';
import type { HassEntities } from '../types/ha';

interface Props { entities: HassEntities; }

const DOMAIN_COLORS: Record<string, string> = {
  light: 'text-yellow-400', switch: 'text-orange-400', sensor: 'text-gray-400',
  binary_sensor: 'text-purple-400', climate: 'text-red-400', fan: 'text-blue-400',
  cover: 'text-amber-700', lock: 'text-green-500', media_player: 'text-indigo-400',
  camera: 'text-gray-500', person: 'text-cyan-400', automation: 'text-pink-400', script: 'text-teal-400',
};

function getDomain(entityId: string) { return entityId.split('.')[0]; }
function getDomainColor(domain: string) { return DOMAIN_COLORS[domain] ?? 'text-ha-muted'; }

export function EntityList({ entities }: Props) {
  const [search, setSearch] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ entityId: string; state: string; name: string }>>();
    for (const [entityId, entity] of Object.entries(entities)) {
      const q = search.toLowerCase();
      if (q && !entityId.toLowerCase().includes(q) && !(entity.attributes['friendly_name'] as string | undefined)?.toLowerCase().includes(q)) continue;
      const domain = getDomain(entityId);
      if (!map.has(domain)) map.set(domain, []);
      map.get(domain)!.push({ entityId, state: entity.state, name: (entity.attributes['friendly_name'] as string | undefined) ?? entityId });
    }
    return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [entities, search]);

  function toggleDomain(domain: string) {
    setExpandedDomains((prev) => { const next = new Set(prev); if (next.has(domain)) next.delete(domain); else next.add(domain); return next; });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-ha-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-ha-text font-semibold text-sm">Entities</h2>
          <span className="text-ha-muted text-xs bg-ha-border px-2 py-0.5 rounded-full">{Object.keys(entities).length}</span>
        </div>
        <input type="search" placeholder="Search entities…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-ha-bg border border-ha-border rounded px-3 py-1.5 text-sm text-ha-text placeholder:text-ha-muted focus:outline-none focus:border-ha-accent" />
      </div>
      <div className="flex-1 overflow-y-auto">
        {grouped.size === 0 && <p className="p-4 text-ha-muted text-sm">No entities found.</p>}
        {[...grouped.entries()].map(([domain, items]) => {
          const isExpanded = expandedDomains.has(domain);
          return (
            <div key={domain} className="border-b border-ha-border">
              <button onClick={() => toggleDomain(domain)} className="w-full flex items-center justify-between px-4 py-2 hover:bg-ha-surface text-left">
                <span className={`text-xs font-semibold uppercase tracking-wider ${getDomainColor(domain)}`}>{domain}</span>
                <span className="flex items-center gap-2">
                  <span className="text-ha-muted text-xs">{items.length}</span>
                  <span className="text-ha-muted text-xs">{isExpanded ? '▲' : '▼'}</span>
                </span>
              </button>
              {isExpanded && (
                <ul>
                  {items.sort((a, b) => a.name.localeCompare(b.name)).map(({ entityId, state, name }) => (
                    <li key={entityId} className="px-4 py-2 flex items-center justify-between hover:bg-ha-surface/50">
                      <div className="min-w-0">
                        <p className="text-ha-text text-xs truncate">{name}</p>
                        <p className="text-ha-muted text-xs truncate font-mono">{entityId}</p>
                      </div>
                      <span className="text-ha-muted text-xs ml-2 shrink-0 bg-ha-border px-1.5 py-0.5 rounded">{state}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
