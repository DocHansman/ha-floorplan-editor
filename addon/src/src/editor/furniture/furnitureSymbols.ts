import { mdiSofa, mdiBed, mdiTableFurniture, mdiDesk, mdiBathtub, mdiToilet, mdiShower, mdiWashingMachine, mdiTelevision, mdiFlower } from '@mdi/js';

export interface FurnitureSymbol { id: string; label: string; path: string; defaultWidth: number; defaultHeight: number; }

export const FURNITURE_SYMBOLS: FurnitureSymbol[] = [
  { id: 'sofa',            label: 'Sofa',            path: mdiSofa,           defaultWidth: 120, defaultHeight: 60 },
  { id: 'bed',             label: 'Bed',             path: mdiBed,            defaultWidth: 90,  defaultHeight: 140 },
  { id: 'dining-table',    label: 'Dining Table',    path: mdiTableFurniture, defaultWidth: 120, defaultHeight: 80 },
  { id: 'desk',            label: 'Desk',            path: mdiDesk,           defaultWidth: 120, defaultHeight: 60 },
  { id: 'bathtub',         label: 'Bathtub',         path: mdiBathtub,        defaultWidth: 80,  defaultHeight: 140 },
  { id: 'toilet',          label: 'Toilet',          path: mdiToilet,         defaultWidth: 50,  defaultHeight: 70 },
  { id: 'shower',          label: 'Shower',          path: mdiShower,         defaultWidth: 70,  defaultHeight: 70 },
  { id: 'washing-machine', label: 'Washing Machine', path: mdiWashingMachine, defaultWidth: 60,  defaultHeight: 60 },
  { id: 'tv',              label: 'TV',              path: mdiTelevision,     defaultWidth: 110, defaultHeight: 40 },
  { id: 'plant',           label: 'Plant',           path: mdiFlower,         defaultWidth: 45,  defaultHeight: 45 },
];

export function getSymbol(id: string): FurnitureSymbol | undefined { return FURNITURE_SYMBOLS.find((s) => s.id === id); }
