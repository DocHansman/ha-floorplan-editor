import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { StatusBar } from './StatusBar';
import { BackgroundImageUpload } from './BackgroundImageUpload';
import { PropertiesPanel } from './PropertiesPanel';
import { PublishModal } from './PublishModal';
import { useEditorStore } from '../store/editorStore';
import type { Project } from '../types/project';

interface Props {
  project: Project;
  onSave: (project: Project) => Promise<void>;
  saving: boolean;
}

export function EditorPanel({ project, onSave, saving }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [showPublish, setShowPublish] = useState(false);

  const { loadFromProject, toCanvasSnapshot, elements } = useEditorStore();

  // Load project into store when project changes
  useEffect(() => {
    loadFromProject(project);
  }, [project.id, loadFromProject]); // only reload on project ID change, not every save

  // Observe container size for responsive canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSave = useCallback(async () => {
    const state = toCanvasSnapshot();
    const updated: Project = {
      ...project,
      canvas: {
        ...project.canvas,
        elements: state.elements,
        backgroundImage: state.backgroundImage,
        backgroundOpacity: state.backgroundOpacity,
        viewBox: state.viewBox,
      },
      updatedAt: new Date().toISOString(),
    };
    await onSave(updated);
  }, [project, toCanvasSnapshot, onSave]);

  // Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Editor top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-ha-surface border-b border-ha-border shrink-0">
        <span className="text-ha-text text-sm font-semibold truncate max-w-xs">
          {project.name}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBgPanel((v) => !v)}
            title="Background image"
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              showBgPanel
                ? 'border-ha-accent text-ha-accent bg-ha-accent/10'
                : 'border-ha-border text-ha-muted hover:text-ha-text'
            }`}
          >
            BG
          </button>
          <span className="text-ha-muted text-xs">{elements.length} el</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-ha-accent text-white text-xs px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setShowPublish(true)}
            className="border border-ha-border text-ha-muted text-xs px-3 py-1 rounded hover:text-ha-text hover:border-ha-accent transition-colors"
            title="Publish to Home Assistant"
          >
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: vertical toolbar */}
        <Toolbar />

        {/* Center: canvas */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0d1117]">
          {canvasSize.width > 0 && (
            <Canvas width={canvasSize.width} height={canvasSize.height} />
          )}
        </div>

        {/* Right: properties + background panels */}
        <aside className="w-56 bg-ha-surface border-l border-ha-border shrink-0 overflow-y-auto flex flex-col">
          <PropertiesPanel />
          <div className="border-t border-ha-border">
            <button
              onClick={() => setShowBgPanel((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-ha-muted hover:text-ha-text"
            >
              <span className="font-semibold uppercase tracking-wider">Background</span>
              <span>{showBgPanel ? '▲' : '▼'}</span>
            </button>
            {showBgPanel && <BackgroundImageUpload />}
          </div>
        </aside>
      </div>

      <StatusBar />

      {showPublish && (
        <PublishModal
          project={project}
          onSave={async (p) => { await onSave(p); }}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
