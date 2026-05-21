import { useState, useEffect } from 'react';
import { haClient } from '../api/haWebSocket';
import type { HassEntities } from '../types/ha';

type ConnectionState = 'connecting' | 'connected' | 'error';

export function useHaConnection() {
  const [state, setState] = useState<ConnectionState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<HassEntities>({});

  useEffect(() => {
    let cancelled = false;

    haClient
      .connect()
      .then(() => {
        if (cancelled) return;
        setState('connected');
        setError(null);
        haClient.getStates().catch(console.error);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState('error');
        setError(err.message);
      });

    const unsub = haClient.onStateChange((e) => {
      if (!cancelled) setEntities(e);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { state, error, entities };
}
