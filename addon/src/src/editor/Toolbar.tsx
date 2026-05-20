import { useEffect } from 'react';
import { useEditorStore, type ToolType } from '../store/editorStore';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface ToolDef {
  id: ToolType;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
}

const TOOLS: ToolDef[] = [
  { id: 'select',    label: 'Select',    shortcut: 'V', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M4 0l16 12-7 2-4 8z"/></svg> },
  { id: 'pan',       label: 'Pan',       shortcut: 'H', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11 3a1 1 0 0 1 2 0v7h2V7a1 1 0 0 1 2 0v5h1a1 1 0 0 1 1 1v4a5 5 0 0 1-5 5h-2A5 5 0 0 1 7 17v-5H5a1 1 0 0 1 0-2h2V7a1 1 0 0 1 2 0v3h2z"/></svg> },
  { id: 'room',      label: 'Room',      shortcut: 'R', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="1"/></svg> },
  { id: 'wall',      label: 'Wall',      shortcut: 'W', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" d="M4 12h16"/></svg> },
  { id: 'device',    label: 'Device',    shortcut: 'D', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> },
  { id: 'furniture', label: 'Furniture', shortcut: 'F', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M7 4a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v5h2v1h2v-1h8v1h2v-1h2v-5a2 2 0 0 0-2-2h-1V6a2 2 0 0 0-2-2z"/></svg> },
];

const ENABLED: Set<ToolType> = new Set(['select', 'pan', 'room', 'wall', 'device', 'furniture']);

export function Toolbar() {
  const { activeTool, showGrid, setActiveTool, setShowGrid } = useEditorStore();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      const tool = TOOLS.find((t) => t.shortcut.toLowerCase() === e.key.toLowerCase());
      if (tool && ENABLED.has(tool.id)) setActiveTool(tool.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool]);

  return (
    <div className="flex flex-col items-center gap-1.5 px-2 py-3 bg-ha-surface border-r border-ha-border w-14 shrink-0">
      {TOOLS.map((tool) => {
        const enabled = ENABLED.has(tool.id);
        const active = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => enabled && setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-lg text-[9px] font-bold transition-all ${
              active
                ? 'text-white bg-ha-accent shadow-lg shadow-ha-accent/30'
                : enabled
                ? 'text-ha-muted hover:text-ha-text hover:bg-ha-border/60 cursor-pointer'
                : 'text-ha-muted/20 cursor-not-allowed'
            }`}
          >
            {tool.icon}
            <span>{tool.shortcut}</span>
          </button>
        );
      })}

      <div className="w-8 border-t border-ha-border my-0.5" />

      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-ha-muted hover:text-ha-text hover:bg-ha-border/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4" />
        </svg>
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="w-10 h-10 flex items-center justify-center rounded-lg text-ha-muted hover:text-ha-text hover:bg-ha-border/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 000 10h4M21 10l-4-4m4 4l-4 4" />
        </svg>
      </button>

      <div className="w-8 border-t border-ha-border my-0.5" />

      <button
        onClick={() => setShowGrid(!showGrid)}
        title={showGrid ? 'Hide grid' : 'Show grid'}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
          showGrid ? 'text-ha-accent bg-ha-accent/15' : 'text-ha-muted hover:text-ha-text hover:bg-ha-border/60'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
