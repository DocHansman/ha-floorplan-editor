import { create } from 'zustand';
import type { FloorPlanElement, Project } from '../types/project';

export type ToolType = 'select' | 'pan' | 'room' | 'wall' | 'device' | 'label' | 'furniture';

export interface CanvasSnapshot {
  elements: FloorPlanElement[];
  backgroundImage: string | undefined;
  backgroundOpacity: number;
  viewBox: { width: number; height: number };
}

const MAX_HISTORY = 100;

export interface EditorState extends CanvasSnapshot {
  stageX: number;
  stageY: number;
  stageScale: number;
  activeTool: ToolType;
  selectedIds: string[];
  showGrid: boolean;
  _past: CanvasSnapshot[];
  _future: CanvasSnapshot[];
  setElements: (elements: FloorPlanElement[]) => void;
  updateElement: (id: string, patch: Partial<FloorPlanElement>) => void;
  addElement: (el: FloorPlanElement) => void;
  removeElements: (ids: string[]) => void;
  setBackgroundImage: (img: string | undefined) => void;
  setBackgroundOpacity: (v: number) => void;
  commitHistory: () => void;
  setViewport: (x: number, y: number, scale: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedIds: (ids: string[]) => void;
  setShowGrid: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  loadFromProject: (project: Project) => void;
  toCanvasSnapshot: () => CanvasSnapshot;
}

function snapshot(s: EditorState): CanvasSnapshot {
  return { elements: s.elements, backgroundImage: s.backgroundImage, backgroundOpacity: s.backgroundOpacity, viewBox: s.viewBox };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  backgroundImage: undefined,
  backgroundOpacity: 0.3,
  viewBox: { width: 1200, height: 800 },
  stageX: 0, stageY: 0, stageScale: 1,
  activeTool: 'select',
  selectedIds: [],
  showGrid: true,
  _past: [], _future: [],

  setElements: (elements) => set({ elements }),
  updateElement: (id, patch) => set((s) => ({ elements: s.elements.map((el) => el.id === id ? ({ ...el, ...patch } as FloorPlanElement) : el) })),
  addElement: (el) => set((s) => ({ elements: [...s.elements, el] })),
  removeElements: (ids) => set((s) => ({ elements: s.elements.filter((el) => !ids.includes(el.id)), selectedIds: s.selectedIds.filter((id) => !ids.includes(id)) })),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),

  commitHistory: () => set((s) => {
    const snap = snapshot(s);
    return { _past: [...s._past, snap].slice(-MAX_HISTORY), _future: [] };
  }),

  setViewport: (stageX, stageY, stageScale) => set({ stageX, stageY, stageScale }),
  setActiveTool: (activeTool) => set({ activeTool, selectedIds: [] }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  setShowGrid: (showGrid) => set({ showGrid }),

  undo: () => set((s) => {
    if (s._past.length === 0) return s;
    const past = [...s._past];
    const prev = past.pop()!;
    return { ...prev, _past: past, _future: [snapshot(s), ...s._future].slice(0, MAX_HISTORY), selectedIds: [] };
  }),

  redo: () => set((s) => {
    if (s._future.length === 0) return s;
    const [next, ...rest] = s._future;
    return { ...next, _past: [...s._past, snapshot(s)].slice(-MAX_HISTORY), _future: rest, selectedIds: [] };
  }),

  loadFromProject: (project) => set({
    elements: project.canvas.elements,
    backgroundImage: project.canvas.backgroundImage,
    backgroundOpacity: project.canvas.backgroundOpacity,
    viewBox: project.canvas.viewBox,
    selectedIds: [], _past: [], _future: [],
    stageX: 0, stageY: 0, stageScale: 1,
  }),

  toCanvasSnapshot: () => snapshot(get()),
}));
