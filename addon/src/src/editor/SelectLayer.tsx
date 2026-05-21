import { useRef, useEffect } from 'react';
import { Layer, Transformer } from 'react-konva';
import type Konva from 'konva';

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>;
  selectedIds: string[];
  onDeselect: () => void;
}

export function SelectLayer({ stageRef, selectedIds }: Props) {
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (selectedIds.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const nodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((n): n is Konva.Node => n !== undefined);

    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, stageRef]);

  return (
    <Layer>
      <Transformer
        ref={trRef}
        anchorFill="#3b82f6"
        anchorStroke="#1d4ed8"
        anchorSize={8}
        borderStroke="#3b82f6"
        borderDash={[4, 2]}
        rotateEnabled={true}
        keepRatio={false}
      />
    </Layer>
  );
}

// Click on stage background → deselect
export function useStageDeselect(
  stageRef: React.RefObject<Konva.Stage | null>,
  onDeselect: () => void,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const stage = stageRef.current;
    if (!stage) return;

    function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
      if (e.target === stage) onDeselect();
    }

    stage.on('click.deselect', handleClick);
    return () => { stage.off('click.deselect'); };
  }, [stageRef, onDeselect, active]);
}
