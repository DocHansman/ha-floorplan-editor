import { useSyncExternalStore } from 'react';
import { haClient } from '../api/haWebSocket';
import type { HassEntities } from '../types/ha';

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

export function useEntities(): HassEntities {
  return useSyncExternalStore(subscribe, getSnapshot);
}
