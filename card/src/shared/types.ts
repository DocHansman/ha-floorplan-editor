// Minimal type copies needed by the card.
// Keep in sync with addon/src/src/types/project.ts and types/ha.ts.
// These are intentionally duplicated to keep the card bundle self-contained.

export type EntityDomain =
  | 'light' | 'switch' | 'sensor' | 'binary_sensor'
  | 'climate' | 'fan' | 'cover' | 'lock'
  | 'media_player' | 'camera' | 'person';

export interface RoomElement {
  type: 'room';
  id: string;
  name: string;
  points: number[];
  fillColor: string;
  opacity: number;
}

export interface WallElement {
  type: 'wall';
  id: string;
  points: number[];
  strokeWidth: number;
  color: string;
}

export interface DeviceMarker {
  type: 'device';
  id: string;
  entityId: string;
  domain: EntityDomain;
  x: number;
  y: number;
  showValue: boolean;
  label?: string;
}

export type FloorPlanElement = RoomElement | WallElement | DeviceMarker;

export interface CanvasConfig {
  viewBox: { width: number; height: number };
  backgroundImage?: string;
  backgroundOpacity: number;
  elements: FloorPlanElement[];
}

export interface CardSettings {
  showLabels: boolean;
  dimInactiveRooms: boolean;
  accentColor: string;
  summaryEntities: {
    lights?: string[];
    windows?: string[];
    temperatureSensor?: string;
  };
}

export interface Project {
  version: '1';
  id: string;
  name: string;
  updatedAt: string;
  canvas: CanvasConfig;
  card: CardSettings;
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

export type HassStates = Record<string, HassEntity>;

// Minimal subset of the HomeAssistant object Lovelace passes to cards
export interface HomeAssistant {
  states: HassStates;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) => Promise<void>;
}

// The YAML config the user puts in their dashboard
export interface LovelaceCardConfig {
  type: string;
  project: string;           // URL to the project JSON, e.g. /local/floorplan-editor/foo.json
  show_labels?: boolean;
  dim_inactive?: boolean;
  accent_color?: string;
  summary?: {
    lights?: string;         // entity_id of a group or comma-separated IDs
    windows?: string;
    temperature?: string;
  };
}
