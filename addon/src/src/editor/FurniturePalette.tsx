import { FURNITURE_SYMBOLS } from './furniture/furnitureSymbols';

interface Props { selected: string; onSelect: (id: string) => void; }

export function FurniturePalette({ selected, onSelect }: Props) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-ha-surface border border-ha-border rounded-xl shadow-2xl p-2 flex gap-2 flex-wrap max-w-sm">
      {FURNITURE_SYMBOLS.map((sym) => (
        <button key={sym.id} onClick={() => onSelect(sym.id)} title={sym.label}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded transition-colors ${
            selected === sym.id ? 'bg-ha-accent/20 border border-ha-accent text-ha-accent' : 'hover:bg-ha-border text-ha-muted hover:text-ha-text border border-transparent'
          }`}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><path d={sym.path} /></svg>
          <span className="text-xs leading-none" style={{ fontSize: '9px' }}>{sym.label}</span>
        </button>
      ))}
    </div>
  );
}
