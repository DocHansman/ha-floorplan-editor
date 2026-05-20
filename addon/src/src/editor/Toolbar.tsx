import { useEffect } from 'react';
import { useEditorStore, type ToolType } from '../store/editorStore';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface ToolDef { id: ToolType; label: string; shortcut: string; }

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'pan', label: 'Pan', shortcut: 'H' },
  { id: 'room', label: 'Room', shortcut: 'R' },
  { id: 'wall', label: 'Wall', shortcut: 'W' },
  { id: 'device', label: 'Device', shortcut: 'D' },
  { id: 'furniture', label: 'Furniture', shortcut: 'F' },
  { id: 'label', label: 'Label', shortcut: 'T' },
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
    <div className="flex flex-col items-center gap-1 p-2 bg-ha-surface border-r border-ha-border w-12 shrink-0">
      {TOOLS.map((tool) => {
        const enabled = ENABLED.has(tool.id);
        const active = activeTool === tool.id;
        return (
          <button key={tool.id} onClick={() => enabled && setActiveTool(tool.id)} title={`${tool.label} (${tool.shortcut})`}
            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors ${
              active ? 'text-ha-accent bg-ha-accent/10' : enabled ? 'text-ha-muted hover:text-ha-text hover:bg-ha-border cursor-pointer' : 'text-ha-muted/25 cursor-not-allowed'
            }`}>
            {tool.shortcut}
          </button>
        );
      })}
      <div className="w-full border-t border-ha-border my-1" />
      <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="w-8 h-8 flex items-center justify-center rounded text-ha-muted hover:text-ha-text hover:bg-ha-border disabled:opacity-25 disabled:cursor-not-allowed">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 010 10H9M3 10l4-4M3 10l4 4" /></svg>
      </button>
      <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)" className="w-8 h-8 flex items-center justify-center rounded text-ha-muted hover:text-ha-text hover:bg-ha-border disabled:opacity-25 disabled:cursor-not-allowed">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 000 10h4M21 10l-4-4m4 4l-4 4" /></svg>
      </button>
      <div className="w-full border-t border-ha-border my-1" />
      <button onClick={() => setShowGrid(!showGrid)} title={showGrid ? 'Hide grid' : 'Show grid'} className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        showGrid ? 'text-ha-accent bg-ha-accent/10' : 'text-ha-muted hover:text-ha-text hover:bg-ha-border'
      }`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}
