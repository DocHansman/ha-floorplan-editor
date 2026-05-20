import type { Project } from '../types/project';
import { ingressBase } from './ingressBase';

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: string;
  roomCount: number;
  deviceCount: number;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(`${ingressBase}/api/projects`);
  if (!res.ok) throw new Error(`Failed to list projects: ${res.status}`);
  return res.json() as Promise<ProjectSummary[]>;
}

export async function loadProject(id: string): Promise<Project> {
  const res = await fetch(`${ingressBase}/api/projects/${id}`);
  if (!res.ok) throw new Error(`Failed to load project: ${res.status}`);
  return res.json() as Promise<Project>;
}

export async function saveProject(project: Project): Promise<void> {
  const payload: Project = { ...project, updatedAt: new Date().toISOString() };
  const res = await fetch(`${ingressBase}/api/projects/${project.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to save project: ${res.status}`);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${ingressBase}/api/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`);
}

export async function renameProject(id: string, name: string): Promise<void> {
  const project = await loadProject(id);
  await saveProject({ ...project, name });
}

export async function duplicateProject(id: string): Promise<Project> {
  const source = await loadProject(id);
  const copy: Project = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name} (copy)`,
    updatedAt: new Date().toISOString(),
  };
  await saveProject(copy);
  return copy;
}
