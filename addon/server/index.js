import express from 'express';
import expressWs from 'express-ws';
import { WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { writeFile, mkdir, readdir, readFile, unlink, copyFile } from 'fs/promises';
import { join } from 'path';

const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN;
const HA_BASE_URL = 'http://supervisor/core';
const HA_WS_URL = 'ws://supervisor/core/websocket';
const PROJECT_DIR = '/config/www/floorplan-editor';
const CARD_JS_SRC = '/app/dist-card/floorplan-editor-card.js';
const CARD_JS_DEST = '/config/www/floorplan-editor-card.js';
const WWW_DIR = '/config/www';
const PORT = process.env.SERVER_PORT || 3001;

const app = express();
const server = createServer(app);
expressWs(app, server);

app.use(express.json({ limit: '10mb' }));

// Serve static frontend build
app.use(express.static('/app/dist'));

// ── REST proxy to HA ─────────────────────────────────────────────

app.use('/api/ha', async (req, res) => {
  const targetPath = req.path.replace(/^\/api\/ha/, '');
  const url = `${HA_BASE_URL}${targetPath}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('HA proxy error:', err);
    res.status(502).json({ error: 'HA proxy error', detail: String(err) });
  }
});

// ── Project file CRUD ────────────────────────────────────────────────

app.get('/api/projects', async (_req, res) => {
  try {
    const files = await readdir(PROJECT_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const projects = await Promise.all(
      jsonFiles.map(async (f) => {
        const raw = await readFile(join(PROJECT_DIR, f), 'utf-8');
        const data = JSON.parse(raw);
        const elements = data.canvas?.elements ?? [];
        return {
          id: data.id,
          name: data.name,
          updatedAt: data.updatedAt,
          roomCount: elements.filter(e => e.type === 'room').length,
          deviceCount: elements.filter(e => e.type === 'device').length,
        };
      })
    );
    res.json(projects);
  } catch (err) {
    if (err.code === 'ENOENT') return res.json([]);
    res.status(500).json({ error: String(err) });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  const filePath = join(PROJECT_DIR, `${req.params.id}.json`);
  try {
    const raw = await readFile(filePath, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: String(err) });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  const project = req.body;
  if (!project || project.id !== req.params.id) {
    return res.status(400).json({ error: 'Invalid project data' });
  }
  const filePath = join(PROJECT_DIR, `${project.id}.json`);
  try {
    await mkdir(PROJECT_DIR, { recursive: true });
    await writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const filePath = join(PROJECT_DIR, `${req.params.id}.json`);
  try {
    await unlink(filePath);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: String(err) });
  }
});

// ── Publish / Dashboard helpers ─────────────────────────────────────────────

app.get('/api/addon/check-card-resource', async (_req, res) => {
  const resourceUrl = '/local/floorplan-editor-card.js';
  const fileExists = existsSync(CARD_JS_DEST);

  let resourceRegistered = false;
  try {
    const r = await fetch(`${HA_BASE_URL}/api/lovelace/resources`, {
      headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
    });
    if (r.ok) {
      const resources = await r.json();
      resourceRegistered = Array.isArray(resources) &&
        resources.some((x) => x.url === resourceUrl);
    }
  } catch { /* non-fatal */ }

  res.json({ fileExists, resourceRegistered, resourceUrl });
});

app.post('/api/addon/publish-project', async (req, res) => {
  const { project } = req.body ?? {};
  if (!project?.id) return res.status(400).json({ error: 'project required' });

  try {
    await mkdir(PROJECT_DIR, { recursive: true });
    await mkdir(WWW_DIR, { recursive: true });

    const filePath = `${PROJECT_DIR}/${project.id}.json`;
    await writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');

    if (existsSync(CARD_JS_SRC)) {
      await copyFile(CARD_JS_SRC, CARD_JS_DEST);
    } else {
      return res.status(500).json({ error: `Card bundle not found at ${CARD_JS_SRC}` });
    }

    res.json({ ok: true, projectPath: `/local/floorplan-editor/${project.id}.json` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/addon/create-dashboard', async (req, res) => {
  const { projectId, projectName, title } = req.body ?? {};
  if (!projectId) return res.status(400).json({ error: 'projectId required' });

  const resourceUrl = '/local/floorplan-editor-card.js';
  const dashTitle = title || projectName || projectId;
  const urlPath = projectName
    ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : projectId;

  try {
    const resListR = await fetch(`${HA_BASE_URL}/api/lovelace/resources`, {
      headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
    });
    const resources = resListR.ok ? await resListR.json() : [];
    const alreadyRegistered = Array.isArray(resources) &&
      resources.some((x) => x.url === resourceUrl);

    if (!alreadyRegistered) {
      await fetch(`${HA_BASE_URL}/api/lovelace/resources`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: resourceUrl, res_type: 'module' }),
      });
    }

    const dashConfig = {
      title: dashTitle,
      views: [{
        title: 'Floorplan',
        path: 'floorplan',
        cards: [{
          type: 'custom:floorplan-editor-card',
          project: `/local/floorplan-editor/${projectId}.json`,
          show_labels: true,
          dim_inactive: false,
        }],
      }],
    };

    const createR = await fetch(`${HA_BASE_URL}/api/lovelace/dashboards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: urlPath,
        title: dashTitle,
        icon: 'mdi:floor-plan',
        show_in_sidebar: true,
        require_admin: false,
        mode: 'storage',
      }),
    });

    if (!createR.ok) {
      const err = await createR.text();
      if (createR.status !== 409) {
        return res.status(502).json({ error: `HA error ${createR.status}: ${err}` });
      }
    }

    await fetch(`${HA_BASE_URL}/api/lovelace/config?dashboard_id=${urlPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dashConfig),
    });

    res.json({ ok: true, dashboardPath: `/${urlPath}` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ── WebSocket bridge to HA ───────────────────────────────────────────────

app.ws('/ws/ha', (clientWs) => {
  let haWs = null;
  let authenticated = false;
  const pendingMessages = [];

  haWs = new WebSocket(HA_WS_URL);

  haWs.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'auth_required') {
      haWs.send(JSON.stringify({ type: 'auth', access_token: SUPERVISOR_TOKEN }));
      return;
    }

    if (msg.type === 'auth_ok') {
      authenticated = true;
      for (const m of pendingMessages) haWs.send(m);
      pendingMessages.length = 0;
      clientWs.send(JSON.stringify({ type: 'auth_ok' }));
      return;
    }

    if (msg.type === 'auth_invalid') {
      clientWs.send(JSON.stringify({ type: 'auth_invalid', message: msg.message }));
      clientWs.close();
      return;
    }

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  haWs.on('close', () => { if (clientWs.readyState === WebSocket.OPEN) clientWs.close(); });
  haWs.on('error', (err) => { console.error('HA WebSocket error:', err); if (clientWs.readyState === WebSocket.OPEN) clientWs.close(); });

  clientWs.on('message', (data) => {
    if (!authenticated) { pendingMessages.push(data.toString()); return; }
    if (haWs.readyState === WebSocket.OPEN) haWs.send(data.toString());
  });

  clientWs.on('close', () => { if (haWs.readyState === WebSocket.OPEN) haWs.close(); });
});

app.get('*', (_req, res) => { res.sendFile('/app/dist/index.html'); });

server.listen(PORT, () => { console.log(`Floorplan Editor server listening on port ${PORT}`); });
