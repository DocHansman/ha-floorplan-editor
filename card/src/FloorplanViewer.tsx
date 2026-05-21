import { useState, useEffect, useRef } from 'react';
import type { Project, HomeAssistant, LovelaceCardConfig, DeviceMarker } from './shared/types';
import { RoomPolygon } from './components/RoomPolygon';
import { DeviceBadge } from './components/DeviceBadge';
import { SummaryBar } from './components/SummaryBar';
import { TweaksPanel, loadOverrides, type CardOverrides } from './components/TweaksPanel';

interface Props {
  hass: HomeAssistant;
  config: LovelaceCardConfig;
}

type LoadState = 'loading' | 'loaded' | 'error';

export function FloorplanViewer({ hass, config }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const [overrides, setOverrides] = useState<CardOverrides>(() => loadOverrides(config.project));

  // Load project JSON
  useEffect(() => {
    if (!config.project) {
      setLoadState('error');
      setErrorMsg('No project URL configured.');
      return;
    }
    setLoadState('loading');
    fetch(config.project)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Project>;
      })
      .then((p) => {
        setProject(p);
        setLoadState('loaded');
      })
      .catch((e: Error) => {
        setLoadState('error');
        setErrorMsg(e.message);
      });
  }, [config.project]);

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setContainerSize({ width, height: height || width * 0.6 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // overrides (localStorage) take priority over card YAML, then project defaults
  const showLabels = overrides.showLabels ?? config.show_labels ?? project?.card.showLabels ?? true;
  const dimInactive = overrides.dimInactive ?? config.dim_inactive ?? project?.card.dimInactiveRooms ?? false;
  const accentColor = overrides.accentColor ?? config.accent_color ?? project?.card.accentColor ?? '#3b82f6';

  if (loadState === 'loading') {
    return (
      <div style={CARD_BASE_STYLE}>
        <p style={{ color: '#9ca3af', fontSize: '13px', padding: '16px' }}>Loading floorplan…</p>
      </div>
    );
  }

  if (loadState === 'error' || !project) {
    return (
      <div style={CARD_BASE_STYLE}>
        <p style={{ color: '#ef4444', fontSize: '13px', padding: '16px' }}>
          Floorplan error: {errorMsg}
        </p>
      </div>
    );
  }

  const { viewBox, elements, backgroundImage, backgroundOpacity } = project.canvas;
  const vbW = viewBox.width;
  const vbH = viewBox.height;

  // Compute uniform scale to fit container
  const scale = Math.min(
    containerSize.width / vbW,
    containerSize.height / vbH,
  );
  const displayW = vbW * scale;
  const displayH = vbH * scale;

  const rooms = elements.filter((e) => e.type === 'room') as import('./shared/types').RoomElement[];
  const walls = elements.filter((e) => e.type === 'wall') as import('./shared/types').WallElement[];
  const devices = elements.filter((e) => e.type === 'device') as DeviceMarker[];

  // Map room → its devices for dim logic
  function devicesForRoom(roomId: string): DeviceMarker[] {
    // Heuristic: device belongs to a room if its point is inside the room polygon
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return [];
    return devices.filter((d) => pointInPolygon(d.x, d.y, room.points));
  }

  return (
    <div style={CARD_BASE_STYLE}>
      <SummaryBar
        states={hass.states}
        summary={config.summary}
        accentColor={accentColor}
      />
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
      >
        <svg
          width={displayW}
          height={displayH}
          viewBox={`0 0 ${vbW} ${vbH}`}
          style={{ background: '#0d1117', display: 'block' }}
        >
          {/* Background reference image */}
          {backgroundImage && (
            <image
              href={backgroundImage}
              x={0}
              y={0}
              width={vbW}
              height={vbH}
              opacity={backgroundOpacity}
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* Rooms */}
          {rooms.map((room) => (
            <RoomPolygon
              key={room.id}
              room={room}
              devices={devicesForRoom(room.id)}
              states={hass.states}
              showLabels={showLabels}
              dimInactive={dimInactive}
              accentColor={accentColor}
            />
          ))}

          {/* Walls */}
          {walls.map((wall) => (
            <polyline
              key={wall.id}
              points={wall.points.map((v, i) =>
                i % 2 === 0 ? `${v},` : `${v} `,
              ).join('')}
              stroke={wall.color}
              strokeWidth={wall.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Device badges */}
          {devices.map((marker) => (
            <DeviceBadge
              key={marker.id}
              marker={marker}
              states={hass.states}
              hass={hass}
            />
          ))}
        </svg>

        <TweaksPanel
          projectUrl={config.project}
          overrides={overrides}
          onChange={setOverrides}
        />
      </div>
    </div>
  );
}

const CARD_BASE_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#0d1117',
  borderRadius: '12px',
  overflow: 'hidden',
  minHeight: '200px',
};

// Ray-casting point-in-polygon test
function pointInPolygon(px: number, py: number, points: number[]): boolean {
  const n = points.length / 2;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = points[i * 2], yi = points[i * 2 + 1];
    const xj = points[j * 2], yj = points[j * 2 + 1];
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
