import type { HassEntities, WsMessage, WsResult, WsEvent } from '../types/ha';

type StateChangeCallback = (entities: HassEntities) => void;

export class HaWebSocketClient {
  private ws: WebSocket | null = null;
  private msgId = 1;
  private pendingRequests = new Map<number, (result: WsResult) => void>();
  private stateListeners = new Set<StateChangeCallback>();
  private entities: HassEntities = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;

  get connected() {
    return this._connected;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      // When served via HA Ingress the pathname is /api/hassio_ingress/<token>/...
      // We need to prepend that base so the WS request goes through ingress.
      const ingressMatch = location.pathname.match(/^(\/api\/hassio_ingress\/[^/]+)/);
      const base = ingressMatch ? ingressMatch[1] : '';
      const wsUrl = `${proto}://${location.host}${base}/ws/ha`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Wait for auth_ok from server before resolving
      };

      this.ws.onmessage = (event) => {
        const msg: WsMessage = JSON.parse(event.data as string);
        this.handleMessage(msg, resolve, reject);
      };

      this.ws.onclose = () => {
        this._connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WS error', err);
        reject(new Error('WebSocket connection failed'));
      };
    });
  }

  private handleMessage(
    msg: WsMessage,
    resolveConnect: () => void,
    rejectConnect: (e: Error) => void,
  ) {
    if (msg.type === 'auth_ok') {
      this._connected = true;
      resolveConnect();
      this.subscribeToStateChanges();
      return;
    }

    if (msg.type === 'auth_invalid') {
      rejectConnect(new Error('HA auth failed'));
      return;
    }

    if (msg.type === 'result') {
      const result = msg as WsResult;
      const handler = this.pendingRequests.get(result.id);
      if (handler) {
        handler(result);
        this.pendingRequests.delete(result.id);
      }
      return;
    }

    if (msg.type === 'event') {
      const event = msg as WsEvent;
      if (event.event.event_type === 'state_changed') {
        const data = event.event.data as { entity_id: string; new_state: unknown };
        if (data.new_state) {
          this.entities = {
            ...this.entities,
            [data.entity_id]: data.new_state as never,
          };
        } else {
          const next = { ...this.entities };
          delete next[data.entity_id];
          this.entities = next;
        }
        this.notifyStateListeners();
      }
    }
  }

  private send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private call<T>(msg: object): Promise<T> {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, (result) => {
        if (result.success) {
          resolve(result.result as T);
        } else {
          reject(new Error(`WS call failed: ${JSON.stringify(result)}`));
        }
      });
      this.send({ ...msg, id });
    });
  }

  async getStates(): Promise<HassEntities> {
    const states = await this.call<Array<{ entity_id: string } & object>>({
      type: 'get_states',
    });
    const map: HassEntities = {};
    for (const s of states) {
      map[s.entity_id] = s as never;
    }
    this.entities = map;
    this.notifyStateListeners();
    return map;
  }

  private async subscribeToStateChanges() {
    await this.call({ type: 'subscribe_events', event_type: 'state_changed' });
  }

  onStateChange(cb: StateChangeCallback) {
    this.stateListeners.add(cb);
    if (Object.keys(this.entities).length > 0) cb(this.entities);
    return () => this.stateListeners.delete(cb);
  }

  private notifyStateListeners() {
    for (const cb of this.stateListeners) cb(this.entities);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(console.error);
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
  }
}

export const haClient = new HaWebSocketClient();
