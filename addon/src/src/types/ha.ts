export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export type HassEntities = Record<string, HassEntity>;

// ── WebSocket message types ───────────────────────────────────────────────────

export interface WsAuthOk {
  type: 'auth_ok';
}

export interface WsResult<T = unknown> {
  id: number;
  type: 'result';
  success: boolean;
  result: T;
}

export interface WsEvent {
  id: number;
  type: 'event';
  event: {
    event_type: string;
    data: unknown;
  };
}

export type WsMessage = WsAuthOk | WsResult | WsEvent | { type: string };
