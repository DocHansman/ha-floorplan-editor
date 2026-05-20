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

export function ProjectPanel({
  projectList,
  currentProject,
  saving,
  saveError,
  onRefreshList,
  onOpenProject,
  onSave,
  onDelete,
  onRename,
  onDuplicate,
}: Props) {
  const [newName, setNewName] = useState('');
  const [canvasPreset, setCanvasPreset] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onRefreshList().catch(console.error);
  }, [onRefreshList]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleCreate() {
    const name = newName.trim() || 'New Project';
    const preset = CANVAS_PRESETS[canvasPreset];
    const project = createEmptyProject(name);
    project.canvas.viewBox = { width: preset.w, height: preset.h };
    try {
      await onSave(project);
      setNewName('');
      flash(`"${name}" created.`);
    } catch { /* saveError shown via props */ }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
    setDeleteConfirm(null);
    await onDelete(id).catch(console.error);
    flash('Deleted.');
  }

  function startRename(p: ProjectSummary) {
    setRenamingId(p.id);
    setRenameValue(p.name);
  }

  async function commitRename(id: string) {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name) return;
    await onRename(id, name).catch(console.error);
  }

  async function handleDuplicate(id: string) {
    await onDuplicate(id).catch(console.error);
    flash('Duplicated.');
  }

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto h-full">
      {/* New project card */}
      <div className="flex flex-col gap-2.5 bg-ha-bg border-2 border-ha-border rounded-xl p-3 shadow-sm">
        <p className="text-ha-muted text-[10px] uppercase tracking-widest font-semibold">New project</p>
        <input
          type="text"
          placeholder="Project name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="w-full bg-ha-surface border border-ha-border rounded-lg px-3 py-2 text-sm text-ha-text placeholder:text-ha-muted focus:outline-none focus:border-ha-accent focus:ring-1 focus:ring-ha-accent/30 transition-colors"
        />
        <select
          value={canvasPreset}
          onChange={(e) => setCanvasPreset(Number(e.target.value))}
          className="w-full bg-ha-surface border border-ha-border rounded-lg px-3 py-2 text-xs text-ha-muted focus:outline-none focus:border-ha-accent transition-colors"
        >
          {CANVAS_PRESETS.map((p, i) => (
            <option key={i} value={i}>{p.label}</option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full bg-ha-accent hover:bg-blue-500 active:bg-blue-700 text-white text-sm py-2.5 rounded-lg disabled:opacity-50 font-semibold transition-colors shadow-sm shadow-ha-accent/20"
        >
          + New Project
        </button>
      </div>

      {feedback && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg px-3 py-2 text-green-400 text-xs">{feedback}</div>
      )}
      {saveError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 text-red-400 text-xs">{saveError}</div>
      )}

      {/* Project list */}
      <div className="flex items-center justify-between">
        <p className="text-ha-muted text-[10px] uppercase tracking-widest font-semibold">Saved projects</p>
        <button
          onClick={() => onRefreshList().catch(console.error)}
          title="Refresh"
          className="w-6 h-6 flex items-center justify-center rounded-md text-ha-muted hover:text-ha-text hover:bg-ha-border/60 transition-colors text-sm"
        >↻</button>
      </div>

      {projectList.length === 0 && (
        <p className="text-ha-muted text-xs text-center py-4">No projects yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {projectList.map((p) => {
          const isOpen = currentProject?.id === p.id;
          return (
            <li
              key={p.id}
              className={`rounded-xl border-2 transition-all overflow-hidden ${
                isOpen
                  ? 'border-ha-accent bg-ha-accent/8 shadow-md shadow-ha-accent/10'
                  : 'border-ha-border bg-ha-bg hover:border-ha-accent/40'
              }`}
            >
              <div className="flex items-center gap-2 px-3 pt-2.5">
                {renamingId === p.id ? (
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(p.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className="flex-1 min-w-0 bg-ha-surface border border-ha-accent rounded-lg px-2 py-1 text-xs text-ha-text focus:outline-none"
                  />
                ) : (
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => onOpenProject(p.id).catch(console.error)}
                  >
                    <span className="text-ha-text text-sm font-semibold truncate block">{p.name}</span>
                  </button>
                )}
                {isOpen && <span className="shrink-0 w-2 h-2 rounded-full bg-ha-accent" />}
              </div>

              <div className="px-3 pb-2 mt-1 flex items-center gap-3 text-ha-muted text-xs">
                <span title="Rooms" className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
                  {p.roomCount}
                </span>
                <span title="Devices" className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><circle cx="12" cy="12" r="4"/></svg>
                  {p.deviceCount}
                </span>
                <span className="flex-1 text-right">{new Date(p.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="border-t border-ha-border/40 flex">
                <ActionBtn onClick={() => onOpenProject(p.id).catch(console.error)}>Open</ActionBtn>
                <ActionBtn onClick={() => startRename(p)}>Rename</ActionBtn>
                <ActionBtn onClick={() => handleDuplicate(p.id)}>Copy</ActionBtn>
                <ActionBtn
                  onClick={() => handleDelete(p.id)}
                  danger={deleteConfirm === p.id}
                  title={deleteConfirm === p.id ? 'Click again to confirm deletion' : 'Delete'}
                >
                  {deleteConfirm === p.id ? 'Sure?' : 'Del'}
                </ActionBtn>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActionBtn({
  onClick, title, danger, children,
}: { onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
        danger
          ? 'text-red-400 hover:bg-red-900/30'
          : 'text-ha-muted hover:text-ha-text hover:bg-ha-border/40'
      }`}
    >
      {children}
    </button>
  );
}
