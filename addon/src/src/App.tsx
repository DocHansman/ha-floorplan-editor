import { useState } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { EntityList } from './components/EntityList';
import { ProjectPanel } from './components/ProjectPanel';
import { EditorPanel } from './editor/EditorPanel';
import { useHaConnection } from './hooks/useHaConnection';
import { useProjectManager } from './hooks/useProjectManager';

type SidebarTab = 'entities' | 'projects';

export function App() {
  const { state: connState, error: connError, entities } = useHaConnection();
  const {
    currentProject,
    projectList,
    saving,
    saveError,
    refreshList,
    openProject,
    save,
    remove,
    rename,
    duplicate,
  } = useProjectManager();

  const [activeTab, setActiveTab] = useState<SidebarTab>('projects');

  return (
    <div className="h-screen bg-ha-bg text-ha-text flex flex-col overflow-hidden">
      <ConnectionStatus state={connState} error={connError} />

      {/* Top bar */}
      <header className="bg-ha-surface border-b-2 border-ha-border px-4 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-ha-accent/15 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-ha-accent">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-ha-text font-bold text-sm leading-tight">Floorplan Editor</h1>
            <p className="text-ha-muted text-[10px] leading-tight">Alpha</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-ha-bg rounded-lg px-2.5 py-1.5 border border-ha-border">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              connState === 'connected'
                ? 'bg-green-400'
                : connState === 'connecting'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-red-400'
            }`}
          />
          <span className="text-ha-muted text-xs">
            {connState === 'connected'
              ? `${Object.keys(entities).length} entities`
              : connState}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-64 bg-ha-surface border-r-2 border-ha-border flex flex-col shrink-0">
          <div className="flex gap-1 p-2 border-b-2 border-ha-border">
            {(['projects', 'entities'] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all ${
                  activeTab === tab
                    ? 'text-white bg-ha-accent shadow-sm'
                    : 'text-ha-muted hover:text-ha-text hover:bg-ha-border/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'entities' ? (
              <EntityList entities={entities} />
            ) : (
              <ProjectPanel
                projectList={projectList}
                currentProject={currentProject}
                saving={saving}
                saveError={saveError}
                onRefreshList={refreshList}
                onOpenProject={openProject}
                onSave={save}
                onDelete={remove}
                onRename={rename}
                onDuplicate={duplicate}
              />
            )}
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 overflow-hidden flex">
          {currentProject ? (
            <EditorPanel
              project={currentProject}
              onSave={save}
              saving={saving}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-ha-muted text-sm mb-1">No project open.</p>
                <p className="text-ha-muted text-xs">
                  Create or open a project from the Projects tab.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
