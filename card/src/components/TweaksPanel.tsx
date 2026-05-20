import { useState, useEffect, useRef } from 'react';

const ACCENT_PRESETS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6','#f97316'];

export interface CardOverrides { accentColor?: string; showLabels?: boolean; dimInactive?: boolean; }
interface Props { projectUrl: string; overrides: CardOverrides; onChange: (overrides: CardOverrides) => void; }
const STORAGE_PREFIX = 'fpeditor-tweaks:';

export function loadOverrides(projectUrl: string): CardOverrides {
  try { const raw = localStorage.getItem(STORAGE_PREFIX + projectUrl); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export function TweaksPanel({ projectUrl, overrides, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) { if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', onDown, { capture: true });
    return () => document.removeEventListener('pointerdown', onDown, { capture: true });
  }, [open]);

  function update(patch: Partial<CardOverrides>) {
    const next = { ...overrides, ...patch };
    onChange(next);
    try { localStorage.setItem(STORAGE_PREFIX + projectUrl, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }

  return (
    <div ref={panelRef} style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10 }}>
      <button onClick={() => setOpen((v) => !v)} title="Tweaks" style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(30,32,48,0.85)', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
        <GearIcon />
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: 40, right: 0, background: '#1c1c2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: '#e1e1e1', fontSize: 12 }}>
          <p style={{ fontWeight: 700, marginBottom: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>Display settings</p>
          <div style={{ marginBottom: 10 }}>
            <p style={{ color: '#9ca3af', marginBottom: 6, fontSize: 11 }}>Accent color</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {ACCENT_PRESETS.map((c) => <button key={c} onClick={() => update({ accentColor: c })} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: overrides.accentColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />)}
              <label style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="color" value={overrides.accentColor ?? '#3b82f6'} onChange={(e) => update({ accentColor: e.target.value })} style={{ opacity: 0, position: 'absolute', width: 1, height: 1 }} />
                <span style={{ color: '#9ca3af', fontSize: 14, lineHeight: 1 }}>+</span>
              </label>
            </div>
          </div>
          <ToggleRow label="Room labels" value={overrides.showLabels ?? true} onChange={(v) => update({ showLabels: v })} />
          <ToggleRow label="Dim inactive rooms" value={overrides.dimInactive ?? false} onChange={(v) => update({ dimInactive: v })} />
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 11 }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 10, background: value ? '#3b82f6' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  );
}

function GearIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.92c.04-.34.07-.68.07-1.08s-.03-.74-.07-1.08l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 10.92c-.04.34-.07.67-.07 1.08s.03.74.07 1.08l-2.11 1.63c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z" /></svg>;
}
