export type EntityDomain =
  | 'light'
  | 'switch'
  | 'sensor'
  | 'binary_sensor'
  | 'climate'
  | 'fan'
  | 'cover'
  | 'lock'
  | 'media_player'
  | 'camera'
  | 'person';

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

export interface FurnitureElement {
  type: 'furniture';
  id: string;
  symbol: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface LabelElement {
  type: 'label';
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
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

export type FloorPlanElement =
  | RoomElement
  | WallElement
  | FurnitureElement
  | LabelElement
  | DeviceMarker;

export interface CanvasConfig {
  viewBox: { width: number; height: number };
  backgroundImage?: string;
  backgroundOpacity: number;
  elements: FloorPlanElement[];
}

export interface CardConfig {
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
  card: CardConfig;
}

export function createEmptyProject(name = 'New Project'): Project {
  return {
    version: '1',
    id: crypto.randomUUID(),
    name,
    updatedAt: new Date().toISOString(),
    canvas: {
      viewBox: { width: 1200, height: 800 },
      backgroundOpacity: 0.3,
      elements: [],
    },
    card: {
      showLabels: true,
      dimInactiveRooms: false,
      accentColor: '#3b82f6',
      summaryEntities: {},
    },
  };
}
