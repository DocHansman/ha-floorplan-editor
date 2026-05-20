import { useEffect, useState, useRef } from 'react';
import type { Project } from '../types/project';
import { createEmptyProject } from '../types/project';
import type { ProjectSummary } from '../api/projects';

const CANVAS_PRESETS = [
  { label: '1200 × 800 (default)', w: 1200, h: 800 },
  { label: '1600 × 1000', w: 1600, h: 1000 },
  { label: '2000 × 1200', w: 2000, h: 1200 },
  { label: '800 × 600 (small)', w: 800, h: 600 },
];

interface Props {
  projectList: ProjectSummary[];
  currentProject: Project | null;
  saving: boolean;
  saveError: string | null;
  onRefreshList: () => Promise<void>;
  onOpenProject: (id: string) => Promise<void>;
  onSave: (project: Project) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<Project>;
}

export function ProjectPanel({ projectList, currentProject, saving, saveError, onRefreshList, onOpenProject, onSave, onDelete, onRename, onDuplicate }: Props) {
  const [newName, setNewName] = useState('');
  const [canvasPreset, setCanvasPreset] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { onRefreshList().catch(console.error); }, [onRefreshList]);
  useEffect(() => { if (renamingId && renameInputRef.current) { renameInputRef.current.focus(); renameInputRef.current.select(); } }, [renamingId]);

  function flash(msg: string) { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); }

  async function handleCreate() {
    const name = newName.trim() || 'New Project';
    const preset = CANVAS_PRESETS[canvasPreset];
    const project = createEmptyProject(name);
    project.canvas.viewBox = { width: preset.w, height: preset.h };
    try { await onSave(project); setNewName(''); flash(`"${name}" created.`); } catch { /* saveError shown via props */ }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setDeleteConfirm(null);
    await onDelete(id).catch(console.error);
    flash('Deleted.');
  }

  function startRename(p: ProjectSummary) { setRenamingId(p.id); setRenameValue(p.name); }

  async function commitRename(id: string) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    await onRename(id, name).catch(console.error);
  }

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      <h2 className="text-ha-text font-semibold text-sm">Projects</h2>
      <div className="flex flex-col gap-2 bg-ha-bg border border-ha-border rounded p-2">
        <input type="text" placeholder="Project name…" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="w-full bg-transparent border border-ha-border rounded px-2 py-1.5 text-sm text-ha-text placeholder:text-ha-muted focus:outline-none focus:border-ha-accent" />
        <select value={canvasPreset} onChange={(e) => setCanvasPreset(Number(e.target.value))}
          className="w-full bg-ha-surface border border-ha-border rounded px-2 py-1.5 text-xs text-ha-muted focus:outline-none focus:border-ha-accent">
          {CANVAS_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
        </select>
        <button onClick={handleCreate} disabled={saving} className="w-full bg-ha-accent text-white text-xs py-1.5 rounded hover:bg-blue-600 disabled:opacity-50 font-semibold">+ New Project</button>
      </div>
      {feedback && <p className="text-green-400 text-xs">{feedback}</p>}
      {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
      <div className="flex items-center justify-between">
        <p className="text-ha-muted text-xs uppercase tracking-wider">Saved projects</p>
        <button onClick={() => onRefreshList().catch(console.error)} title="Refresh" className="text-ha-muted text-xs hover:text-ha-text">↻</button>
      </div>
      {projectList.length === 0 && <p className="text-ha-muted text-xs">No projects yet.</p>}
      <ul className="flex flex-col gap-2">
        {projectList.map((p) => {
          const isOpen = currentProject?.id === p.id;
          return (
            <li key={p.id} className={`rounded border transition-colors ${
              isOpen ? 'border-ha-accent bg-ha-accent/5' : 'border-ha-border bg-ha-bg hover:border-ha-accent/50'
            }`}>
              <div className="flex items-center gap-1 px-2 pt-2">
                {renamingId === p.id ? (
                  <input ref={renameInputRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(p.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(p.id); if (e.key === 'Escape') setRenamingId(null); }}
                    className="flex-1 min-w-0 bg-ha-surface border border-ha-accent rounded px-1 py-0.5 text-xs text-ha-text focus:outline-none" />
                ) : (
                  <button className="flex-1 min-w-0 text-left" onClick={() => onOpenProject(p.id).catch(console.error)}>
                    <span className="text-ha-text text-xs font-semibold truncate block">{p.name}</span>
                  </button>
                )}
                {isOpen && <span className="shrink-0 text-ha-accent text-xs font-bold">●</span>}
              </div>
              <div className="px-2 pb-1.5 mt-0.5 flex items-center gap-2 text-ha-muted text-xs">
                <span title="Rooms">⬡ {p.roomCount}</span>
                <span title="Devices">◉ {p.deviceCount}</span>
                <span className="flex-1 text-right truncate">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="border-t border-ha-border/50 flex divide-x divide-ha-border/50">
                <ActionBtn onClick={() => onOpenProject(p.id).catch(console.error)}>Open</ActionBtn>
                <ActionBtn onClick={() => startRename(p)}>Rename</ActionBtn>
                <ActionBtn onClick={() => onDuplicate(p.id).catch(console.error)}>Copy</ActionBtn>
                <ActionBtn onClick={() => handleDelete(p.id)} danger={deleteConfirm === p.id}>{deleteConfirm === p.id ? 'Sure?' : 'Del'}</ActionBtn>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActionBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 py-1 text-xs transition-colors ${
      danger ? 'text-red-400 hover:bg-red-900/30' : 'text-ha-muted hover:text-ha-text hover:bg-ha-border/30'
    }`}>{children}</button>
  );
}
