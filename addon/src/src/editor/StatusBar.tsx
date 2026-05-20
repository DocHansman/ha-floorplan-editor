import { useEditorStore } from '../store/editorStore';

export function StatusBar() {
  const { stageScale, stageX, stageY, viewBox, elements, selectedIds, activeTool } = useEditorStore();
  return (
    <div className="h-7 bg-ha-surface border-t border-ha-border flex items-center gap-4 px-3 shrink-0">
      <span className="text-ha-muted text-xs font-mono">{Math.round(stageScale * 100)}%</span>
      <span className="text-ha-muted text-xs font-mono">({Math.round(-stageX / stageScale)}, {Math.round(-stageY / stageScale)})</span>
      <span className="text-ha-muted text-xs">{viewBox.width}×{viewBox.height}</span>
      <span className="text-ha-muted text-xs">{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
      {selectedIds.length > 0 && <span className="text-ha-accent text-xs">{selectedIds.length} selected</span>}
      <span className="ml-auto text-ha-muted text-xs capitalize">{activeTool}</span>
    </div>
  );
}
