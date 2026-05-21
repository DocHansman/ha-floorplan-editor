import { create } from 'zustand';
import type { FloorPlanElement, Project } from '../types/project';

export type ToolType = 'select' | 'pan' | 'room' | 'wall' | 'device' | 'label' | 'furniture';

// The canvas state that participates in undo/redo
export interface CanvasSnapshot {
  elements: FloorPlanElement[];
  backgroundImage: string | undefined;
  backgroundOpacity: number;
  viewBox: { width: number; height: number };
}

const MAX_HISTORY = 100;

export interface EditorState extends CanvasSnapshot {
  // Viewport — NOT in undo history
  stageX: number;
  stageY: number;
  stageScale: number;

  // Tool & selection
  activeTool: ToolType;
  selectedIds: string[];

  // UI
  showGrid: boolean;

  // Undo/redo stacks (snapshots of CanvasSnapshot)
  _past: CanvasSnapshot[];
  _future: CanvasSnapshot[];

  // ── Canvas mutations (always call commitHistory() after finishing an action) ──
  setElements: (elements: FloorPlanElement[]) => void;
  updateElement: (id: string, patch: Partial<FloorPlanElement>) => void;
  addElement: (el: FloorPlanElement) => void;
  removeElements: (ids: string[]) => void;
  setBackgroundImage: (img: string | undefined) => void;
  setBackgroundOpacity: (v: number) => void;

  // Call after any finished edit action to push to undo stack
  commitHistory: () => void;

  // ── Non-history state ──
  setViewport: (x: number, y: number, scale: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedIds: (ids: string[]) => void;
  setShowGrid: (v: boolean) => void;

  // ── Undo/redo ──
  undo: () => void;
  redo: () => void;

  // ── Project serialization ──
  loadFromProject: (project: Project) => void;
  toCanvasSnapshot: () => CanvasSnapshot;
}

function snapshot(s: EditorState): CanvasSnapshot {
  return {
    elements: s.elements,
    backgroundImage: s.backgroundImage,
    backgroundOpacity: s.backgroundOpacity,
    viewBox: s.viewBox,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // ── Initial canvas state ──
  elements: [],
  backgroundImage: undefined,
  backgroundOpacity: 0.3,
  viewBox: { width: 1200, height: 800 },

  // ── Viewport ──
  stageX: 0,
  stageY: 0,
  stageScale: 1,

  // ── Tool ──
  activeTool: 'select',
  selectedIds: [],
  showGrid: true,

  // ── History ──
  _past: [],
  _future: [],

  // ── Canvas mutations ──
  setElements: (elements) => set({ elements }),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) =>
        el.id === id ? ({ ...el, ...patch } as FloorPlanElement) : el,
      ),
    })),

  addElement: (el) =>
    set((s) => ({ elements: [...s.elements, el] })),

  removeElements: (ids) =>
    set((s) => ({
      elements: s.elements.filter((el) => !ids.includes(el.id)),
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
    })),

  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  setBackgroundOpacity: (backgroundOpacity) => set({ backgroundOpacity }),

  commitHistory: () =>
    set((s) => {
      const snap = snapshot(s);
      const newPast = [...s._past, snap].slice(-MAX_HISTORY);
      return { _past: newPast, _future: [] };
    }),

  // ── Non-history ──
  setViewport: (stageX, stageY, stageScale) => set({ stageX, stageY, stageScale }),

  setActiveTool: (activeTool) => set({ activeTool, selectedIds: [] }),

  setSelectedIds: (selectedIds) => set({ selectedIds }),

  setShowGrid: (showGrid) => set({ showGrid }),

  // ── Undo/redo ──
  undo: () =>
    set((s) => {
      if (s._past.length === 0) return s;
      const past = [...s._past];
      const prev = past.pop()!;
      const currentSnap = snapshot(s);
      return {
        ...prev,
        _past: past,
        _future: [currentSnap, ...s._future].slice(0, MAX_HISTORY),
        selectedIds: [],
      };
    }),

  redo: () =>
    set((s) => {
      if (s._future.length === 0) return s;
      const [next, ...rest] = s._future;
      const currentSnap = snapshot(s);
      return {
        ...next,
        _past: [...s._past, currentSnap].slice(-MAX_HISTORY),
        _future: rest,
        selectedIds: [],
      };
    }),

  // ── Project I/O ──
  loadFromProject: (project) =>
    set({
      elements: project.canvas.elements,
      backgroundImage: project.canvas.backgroundImage,
      backgroundOpacity: project.canvas.backgroundOpacity,
      viewBox: project.canvas.viewBox,
      selectedIds: [],
      _past: [],
      _future: [],
      stageX: 0,
      stageY: 0,
      stageScale: 1,
    }),

  toCanvasSnapshot: () => snapshot(get()),
}));
