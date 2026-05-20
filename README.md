# HA Floorplan Editor

A WYSIWYG editor for Home Assistant that lets you draw interactive floorplans and display live device states directly on your dashboard.
It ships as two components: a **Docker Add-on** (the editor) and a **Custom Lovelace Card** (the viewer).

---

## Installation

### Add-on (Editor)

1. In Home Assistant go to **Settings → Add-ons → Add-on Store → ⋮ → Repositories**
2. Add the repository URL: `https://github.com/DocHansman/ha-floorplan-editor`
3. Install **Floorplan Editor** from the store
4. Start the add-on and open it via the sidebar

### Custom Card (HACS)

1. Open **HACS → Frontend → + Explore & Download**
2. Search for **Floorplan Editor Card** and install it
3. Add the resource to your dashboard:
   ```yaml
   url: /local/floorplan-editor-card.js
   type: module
   ```
   Or use the **Publish** button inside the editor — it registers the resource automatically.

---

## Quick Start

1. Open the **Floorplan Editor** add-on from the HA sidebar
2. Click **+ New Project** and give it a name
3. Draw rooms with the **R** tool (click to add vertices, double-click to close)
4. Place device badges with the **D** tool, then pick an entity from the popup
5. Add furniture outlines with the **F** tool
6. Click **Publish** → the editor saves the project and creates a Lovelace dashboard for you
7. Open the generated dashboard — your floorplan is live

---

## Card Configuration Reference

```yaml
type: custom:floorplan-editor-card
project: /local/floorplan-editor/<project-id>.json   # required
show_labels: true
dim_inactive: false
accent_color: "#3b82f6"
summary:
  lights: light.all_lights
  windows: binary_sensor.fenster
  temperature: sensor.wohnung_temp
```

| Field | Type | Default | Description |
|---|---|---|---|
| `project` | `string` | — | URL to the project JSON file |
| `show_labels` | `boolean` | `true` | Show room name labels |
| `dim_inactive` | `boolean` | `false` | Dim rooms that have no active device |
| `accent_color` | `string` | `#3b82f6` | Color used for active device badges and accents |
| `summary.lights` | `string` | — | Entity ID for light summary count |
| `summary.windows` | `string` | — | Entity ID for window/cover summary count |
| `summary.temperature` | `string` | — | Entity ID for temperature display |

---

## Known Limitations

- **Single floor only** — multi-floor support (tab switching) is planned for a future release
- **No label tool yet** — free-text labels on the canvas are not yet implemented
- **Card bundle size** — the card JS is ~483 KB (152 KB gzip) due to bundled React
- **Background images are editor-only** — not shown in the card view
- **Ingress required** — the editor add-on uses HA Ingress; direct port access is not supported
