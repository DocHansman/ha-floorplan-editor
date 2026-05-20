import { useState, type RefObject } from 'react';
import type Konva from 'konva';
import { useEditorStore } from '../../store/editorStore';
import type { FurnitureElement } from '../../types/project';
import { stageToCanvas } from '../tools/snapUtils';

export function useFurnitureTool(stageRef: RefObject<Konva.Stage | null>) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('sofa');
  const { addElement, commitHistory, stageX, stageY, stageScale } = useEditorStore();

  function handleClick(_e: Konva.KonvaEventObject<MouseEvent>) {
    const stage = stageRef.current; if (!stage) return;
    const pos = stage.getPointerPosition(); if (!pos) return;
    const { x: cx, y: cy } = stageToCanvas(pos.x, pos.y, stageX, stageY, stageScale);
    const el: FurnitureElement = { type: 'furniture', id: crypto.randomUUID(), symbol: selectedSymbol, x: cx, y: cy, width: 80, height: 80, rotation: 0 };
    addElement(el);
    commitHistory();
  }

  return { selectedSymbol, setSelectedSymbol, handleClick };
}
