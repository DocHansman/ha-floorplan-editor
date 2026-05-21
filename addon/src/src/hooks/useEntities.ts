import { useSyncExternalStore } from 'react';
import { haClient } from '../api/haWebSocket';
import type { HassEntities } from '../types/ha';

// Singleton cache so every component share the same snapshot
let _entities: HassEntities = {};
const _listeners = new Set<() => void>();

haClient.onStateChange((e) => {
  _entities = e;
  for (const l of _listeners) l();
});

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getSnapshot(): HassEntities {
  return _entities;
}

/**
 * Returns the live HassEntities map.
 * Uses useSyncExternalStore so it integrates correctly with React 18 concurrent mode.
 */
export function useEntities(): HassEntities {
  return useSyncExternalStore(subscribe, getSnapshot);
}
