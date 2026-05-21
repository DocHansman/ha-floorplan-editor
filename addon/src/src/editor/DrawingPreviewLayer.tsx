import { Layer, Line, Circle } from 'react-konva';
import type { DraftRoom } from './tools/useRoomTool';
import type { DraftWall } from './tools/useWallTool';

interface Props {
  roomDraft: DraftRoom | null;
  wallDraft: DraftWall | null;
  stageScale: number;
}

export function DrawingPreviewLayer({ roomDraft, wallDraft, stageScale }: Props) {
  const strokeWidth = 1.5 / stageScale;
  const dashLen = 6 / stageScale;

  return (
    <Layer listening={false}>
      {/* ── Room preview ─────────────────────────────────────────── */}
      {roomDraft && roomDraft.points.length >= 2 && (
        <>
          {/* Committed edges */}
          <Line
            points={roomDraft.points}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            dash={[dashLen, dashLen]}
          />
          {/* Edge from last vertex to cursor */}
          <Line
            points={[
              roomDraft.points[roomDraft.points.length - 2],
              roomDraft.points[roomDraft.points.length - 1],
              roomDraft.cursorX,
              roomDraft.cursorY,
            ]}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            dash={[dashLen, dashLen]}
          />
          {/* Start-point indicator (snap target) */}
          {roomDraft.points.length >= 6 && (
            <Circle
              x={roomDraft.points[0]}
              y={roomDraft.points[1]}
              radius={8 / stageScale}
              fill="#3b82f6"
              opacity={0.8}
            />
          )}
          {/* All committed vertices */}
          {Array.from({ length: roomDraft.points.length / 2 }).map((_, i) => (
            <Circle
              key={i}
              x={roomDraft.points[i * 2]}
              y={roomDraft.points[i * 2 + 1]}
              radius={3 / stageScale}
              fill="#93c5fd"
            />
          ))}
        </>
      )}

      {/* ── Wall preview ─────────────────────────────────────────── */}
      {wallDraft && wallDraft.points.length >= 2 && (
        <>
          <Line
            points={wallDraft.points}
            stroke="#94a3b8"
            strokeWidth={2 / stageScale}
          />
          <Line
            points={[
              wallDraft.points[wallDraft.points.length - 2],
              wallDraft.points[wallDraft.points.length - 1],
              wallDraft.cursorX,
              wallDraft.cursorY,
            ]}
            stroke="#94a3b8"
            strokeWidth={2 / stageScale}
            dash={[dashLen, dashLen]}
          />
          {Array.from({ length: wallDraft.points.length / 2 }).map((_, i) => (
            <Circle
              key={i}
              x={wallDraft.points[i * 2]}
              y={wallDraft.points[i * 2 + 1]}
              radius={3 / stageScale}
              fill="#cbd5e1"
            />
          ))}
        </>
      )}
    </Layer>
  );
}
