import { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';

export function useSelectTool() {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const removeElements = useEditorStore((s) => s.removeElements);
  const commitHistory = useEditorStore((s) => s.commitHistory);
  const activeTool = useEditorStore((s) => s.activeTool);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (activeTool !== 'select' || selectedIds.length === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeElements(selectedIds); commitHistory(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTool, selectedIds, removeElements, commitHistory]);
}
