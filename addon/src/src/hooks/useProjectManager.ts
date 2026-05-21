import { useState, useCallback } from 'react';
import type { Project } from '../types/project';
import { saveProject, listProjects, loadProject, deleteProject, renameProject, duplicateProject } from '../api/projects';
import type { ProjectSummary } from '../api/projects';

export function useProjectManager() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    const list = await listProjects();
    setProjectList(list);
  }, []);

  const openProject = useCallback(async (id: string) => {
    const project = await loadProject(id);
    setCurrentProject(project);
  }, []);

  const save = useCallback(
    async (project: Project) => {
      setSaving(true);
      setSaveError(null);
      try {
        await saveProject(project);
        setCurrentProject(project);
        await refreshList();
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [refreshList],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteProject(id);
      if (currentProject?.id === id) setCurrentProject(null);
      await refreshList();
    },
    [currentProject, refreshList],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await renameProject(id, name);
      if (currentProject?.id === id) setCurrentProject((p) => p ? { ...p, name } : p);
      await refreshList();
    },
    [currentProject, refreshList],
  );

  const duplicate = useCallback(
    async (id: string) => {
      const copy = await duplicateProject(id);
      await refreshList();
      return copy;
    },
    [refreshList],
  );

  return {
    currentProject,
    setCurrentProject,
    projectList,
    refreshList,
    openProject,
    save,
    remove,
    rename,
    duplicate,
    saving,
    saveError,
  };
}
