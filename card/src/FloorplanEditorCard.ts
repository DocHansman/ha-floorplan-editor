import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FloorplanViewer } from './FloorplanViewer';
import type { HomeAssistant, LovelaceCardConfig } from './shared/types';

class FloorplanEditorCard extends HTMLElement {
  private _root: Root | null = null;
  private _hass: HomeAssistant | null = null;
  private _config: LovelaceCardConfig | null = null;
  private _mountDiv: HTMLDivElement | null = null;

  connectedCallback() {
    if (!this._mountDiv) { this._mountDiv = document.createElement('div'); this._mountDiv.style.cssText = 'display:contents;'; this.appendChild(this._mountDiv); }
    if (!this._root) this._root = createRoot(this._mountDiv);
    this._render();
  }

  disconnectedCallback() {
    setTimeout(() => { if (!this.isConnected) { this._root?.unmount(); this._root = null; } }, 0);
  }

  set hass(hass: HomeAssistant) { this._hass = hass; this._render(); }

  setConfig(config: LovelaceCardConfig) {
    if (!config.project) throw new Error('floorplan-editor-card: "project" is required.');
    this._config = config; this._render();
  }

  private _render() {
    if (!this._root || !this._hass || !this._config) return;
    this._root.render(React.createElement(FloorplanViewer, { hass: this._hass, config: this._config }));
  }

  getCardSize(): number { return 6; }

  static getStubConfig(): Partial<LovelaceCardConfig> {
    return { project: '/local/floorplan-editor/my-project.json', show_labels: true, dim_inactive: false };
  }
}

customElements.define('floorplan-editor-card', FloorplanEditorCard);

interface CustomCardEntry { type: string; name: string; description: string; preview?: boolean; }
declare global { interface Window { customCards?: CustomCardEntry[]; } }
window.customCards = window.customCards ?? [];
window.customCards.push({ type: 'floorplan-editor-card', name: 'Floorplan Editor Card', description: 'Renders an interactive floorplan created with the Floorplan Editor add-on.', preview: false });
