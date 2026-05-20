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
    currentProject, projectList, saving, saveError,
    refreshList, openProject, save, remove, rename, duplicate,
  } = useProjectManager();

  const [activeTab, setActiveTab] = useState<SidebarTab>('projects');

  return (
    <div className="h-screen bg-ha-bg text-ha-text flex flex-col overflow-hidden">
      <ConnectionStatus state={connState} error={connError} />

      <header className="bg-ha-surface border-b border-ha-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-ha-accent text-lg leading-none">⬡</span>
          <h1 className="text-ha-text font-semibold text-sm">Floorplan Editor</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            connState === 'connected' ? 'bg-green-400' :
            connState === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className="text-ha-muted text-xs">
            {connState === 'connected' ? `${Object.keys(entities).length} entities` : connState}
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-ha-surface border-r border-ha-border flex flex-col shrink-0">
          <div className="flex border-b border-ha-border">
            {(['projects', 'entities'] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-ha-accent border-b-2 border-ha-accent' : 'text-ha-muted hover:text-ha-text'
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

        <main className="flex-1 overflow-hidden flex">
          {currentProject ? (
            <EditorPanel project={currentProject} onSave={save} saving={saving} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-ha-muted text-sm mb-1">No project open.</p>
                <p className="text-ha-muted text-xs">Create or open a project from the Projects tab.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
