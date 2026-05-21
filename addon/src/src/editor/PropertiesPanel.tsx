import { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import type { RoomElement, WallElement, DeviceMarker, FurnitureElement } from '../types/project';
import { DEFAULT_ROOM_COLORS } from './tools/useRoomTool';
import { EntityPicker } from './EntityPicker';
import { getDomainConfig, entityDomain } from './domain/domainConfig';
import { useEntities } from '../hooks/useEntities';
import type { EntityDomain } from '../types/project';

export function PropertiesPanel() {
  const elements = useEditorStore((s) => s.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const updateElement = useEditorStore((s) => s.updateElement);
  const commitHistory = useEditorStore((s) => s.commitHistory);

  if (selectedIds.length === 0) {
    return (
      <div className="p-3 text-ha-muted text-xs">
        Select an element to edit its properties.
      </div>
    );
  }

  // Single selection only for now
  const id = selectedIds[0];
  const el = elements.find((e) => e.id === id);
  if (!el) return null;

  function commit() {
    commitHistory();
  }

  if (el.type === 'room') {
    const patchRoom = (p: Partial<RoomElement>) => updateElement(id, p);
    return <RoomProperties room={el} patch={patchRoom} commit={commit} />;
  }
  if (el.type === 'wall') {
    const patchWall = (p: Partial<WallElement>) => updateElement(id, p);
    return <WallProperties wall={el} patch={patchWall} commit={commit} />;
  }

  if (el.type === 'device') {
    const patchDevice = (p: Partial<DeviceMarker>) => updateElement(id, p);
    return <DeviceProperties marker={el} patch={patchDevice} commit={commit} />;
  }

  if (el.type === 'furniture') {
    const patchFurniture = (p: Partial<FurnitureElement>) => updateElement(id, p);
    return <FurnitureProperties el={el} patch={patchFurniture} commit={commit} />;
  }

  return (
    <div className="p-3 text-ha-muted text-xs">
      No properties for this element type.
    </div>
  );
}

function RoomProperties({
  room,
  patch,
  commit,
}: {
  room: RoomElement;
  patch: (p: Partial<RoomElement>) => void;
  commit: () => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <p className="text-ha-muted text-xs uppercase tracking-wider font-semibold">Room</p>

      {/* Name */}
      <label className="block">
        <span className="text-ha-muted text-xs">Name</span>
        <input
          type="text"
          value={room.name}
          onChange={(e) => patch({ name: e.target.value })}
          onBlur={commit}
          className="mt-1 w-full bg-ha-bg border border-ha-border rounded px-2 py-1 text-sm text-ha-text focus:outline-none focus:border-ha-accent"
        />
      </label>

      {/* Color palette */}
      <div>
        <span className="text-ha-muted text-xs">Fill color</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {DEFAULT_ROOM_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { patch({ fillColor: c }); commit(); }}
              className="w-6 h-6 rounded-full border-2 transition-all"
              style={{
                background: c,
                borderColor: room.fillColor === c ? '#fff' : 'transparent',
              }}
              title={c}
            />
          ))}
          {/* Custom color */}
          <label
            className="w-6 h-6 rounded-full border-2 border-ha-border cursor-pointer overflow-hidden flex items-center justify-center"
            title="Custom color"
          >
            <input
              type="color"
              value={room.fillColor}
              onChange={(e) => patch({ fillColor: e.target.value })}
              onBlur={commit}
              className="opacity-0 absolute w-px h-px"
            />
            <span className="text-ha-muted text-xs pointer-events-none">+</span>
          </label>
        </div>
      </div>

      {/* Opacity */}
      <label className="block">
        <div className="flex justify-between">
          <span className="text-ha-muted text-xs">Opacity</span>
          <span className="text-ha-muted text-xs">{Math.round(room.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={room.opacity}
          onChange={(e) => patch({ opacity: Number(e.target.value) })}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="mt-1 w-full accent-ha-accent"
        />
      </label>
    </div>
  );
}

function WallProperties({
  wall,
  patch,
  commit,
}: {
  wall: WallElement;
  patch: (p: Partial<WallElement>) => void;
  commit: () => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <p className="text-ha-muted text-xs uppercase tracking-wider font-semibold">Wall</p>

      {/* Color */}
      <div>
        <span className="text-ha-muted text-xs">Color</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={wall.color}
            onChange={(e) => patch({ color: e.target.value })}
            onBlur={commit}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-ha-border"
          />
          <span className="text-ha-muted text-xs font-mono">{wall.color}</span>
        </div>
      </div>

      {/* Stroke width */}
      <label className="block">
        <div className="flex justify-between">
          <span className="text-ha-muted text-xs">Stroke width</span>
          <span className="text-ha-muted text-xs">{wall.strokeWidth}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={wall.strokeWidth}
          onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="mt-1 w-full accent-ha-accent"
        />
      </label>
    </div>
  );
}

function DeviceProperties({
  marker,
  patch,
  commit,
}: {
  marker: DeviceMarker;
  patch: (p: Partial<DeviceMarker>) => void;
  commit: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState({ x: 0, y: 0 });
  const entities = useEntities();
  const entity = marker.entityId ? entities[marker.entityId] : undefined;
  const dom = marker.entityId ? entityDomain(marker.entityId) : marker.domain;
  const cfg = getDomainConfig(dom);
  const friendlyName = (entity?.attributes['friendly_name'] as string | undefined) ?? marker.entityId;

  function openPicker(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPickerAnchor({ x: rect.left, y: rect.top });
    setPickerOpen(true);
  }

  function handlePickEntity(entityId: string, domain: EntityDomain) {
    patch({ entityId, domain });
    commit();
    setPickerOpen(false);
  }

  return (
    <div className="p-3 space-y-3">
      <p className="text-ha-muted text-xs uppercase tracking-wider font-semibold">Device</p>

      {/* Current entity */}
      <div>
        <span className="text-ha-muted text-xs">Entity</span>
        <div className="mt-1 flex items-center gap-2 bg-ha-bg border border-ha-border rounded px-2 py-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: cfg.activeColor }}
          />
          <div className="min-w-0 flex-1">
            {marker.entityId ? (
              <>
                <p className="text-ha-text text-xs truncate">{friendlyName}</p>
                <p className="text-ha-muted text-xs font-mono truncate">{marker.entityId}</p>
              </>
            ) : (
              <p className="text-ha-muted text-xs italic">No entity assigned</p>
            )}
          </div>
          {entity && (
            <span className="text-ha-muted text-xs shrink-0 bg-ha-border px-1 py-0.5 rounded font-mono">
              {entity.state}
            </span>
          )}
        </div>
        <button
          onClick={openPicker}
          className="mt-1.5 w-full text-xs text-ha-accent border border-ha-accent/40 rounded py-1 hover:bg-ha-accent/10 transition-colors"
        >
          {marker.entityId ? 'Change entity' : 'Assign entity'}
        </button>
      </div>

      {/* Show value toggle */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-ha-muted text-xs">Show value</span>
        <button
          onClick={() => { patch({ showValue: !marker.showValue }); commit(); }}
          className={`w-9 h-5 rounded-full transition-colors relative ${
            marker.showValue ? 'bg-ha-accent' : 'bg-ha-border'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              marker.showValue ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </label>

      {/* Optional label */}
      <label className="block">
        <span className="text-ha-muted text-xs">Label (optional)</span>
        <input
          type="text"
          value={marker.label ?? ''}
          placeholder="e.g. Living Room Light"
          onChange={(e) => patch({ label: e.target.value || undefined })}
          onBlur={commit}
          className="mt-1 w-full bg-ha-bg border border-ha-border rounded px-2 py-1 text-xs text-ha-text focus:outline-none focus:border-ha-accent placeholder:text-ha-muted/50"
        />
      </label>

      {pickerOpen && (
        <EntityPicker
          anchorX={pickerAnchor.x}
          anchorY={pickerAnchor.y}
          onSelect={handlePickEntity}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

const ROTATION_STEPS = [0, 90, 180, 270];

function FurnitureProperties({
  el,
  patch,
  commit,
}: {
  el: FurnitureElement;
  patch: (p: Partial<FurnitureElement>) => void;
  commit: () => void;
}) {
  return (
    <div className="p-3 space-y-3">
      <p className="text-ha-muted text-xs uppercase tracking-wider font-semibold">Furniture</p>

      {/* Rotation presets */}
      <div>
        <span className="text-ha-muted text-xs">Rotation</span>
        <div className="mt-1 flex gap-1">
          {ROTATION_STEPS.map((deg) => (
            <button
              key={deg}
              onClick={() => { patch({ rotation: deg }); commit(); }}
              className={`flex-1 py-1 text-xs rounded border transition-colors ${
                el.rotation === deg
                  ? 'border-ha-accent text-ha-accent bg-ha-accent/10'
                  : 'border-ha-border text-ha-muted hover:text-ha-text'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <label className="block">
        <div className="flex justify-between">
          <span className="text-ha-muted text-xs">Width</span>
          <span className="text-ha-muted text-xs">{Math.round(el.width)}px</span>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          step={5}
          value={el.width}
          onChange={(e) => patch({ width: Number(e.target.value) })}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="mt-1 w-full accent-ha-accent"
        />
      </label>

      <label className="block">
        <div className="flex justify-between">
          <span className="text-ha-muted text-xs">Height</span>
          <span className="text-ha-muted text-xs">{Math.round(el.height)}px</span>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          step={5}
          value={el.height}
          onChange={(e) => patch({ height: Number(e.target.value) })}
          onMouseUp={commit}
          onTouchEnd={commit}
          className="mt-1 w-full accent-ha-accent"
        />
      </label>
    </div>
  );
}
