// src/server/index.js
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWatcher, getAllFiles } from '../cli/utils.js';
import { generateContentFile } from './fileUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer({ port, watchDir, config }) {
  const app = express();
  const watcher = setupWatcher(watchDir, config);

  // Create HTTP server explicitly to attach WebSocket server
  const server = app.listen(port);
  const wss = new WebSocketServer({ server });

  app.use(express.static(path.join(__dirname, '../../dist')));
  app.use(express.json());

  // Store connected clients to broadcast updates
  const clients = new Set();

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected');

    // Send initial file list
    getAllFiles(watchDir).then(files => {
      ws.send(JSON.stringify({
        type: 'files',
        files
      }));
    });

    // Clean up on client disconnect
    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });
  });

  // File watcher events
  watcher.on('all', async (event, path) => {
    if (['add', 'unlink', 'change'].includes(event)) {
      try {
        const files = await getAllFiles(watchDir);
        const message = JSON.stringify({
          type: 'files',
          files,
          event,
          path
        });

        // Broadcast to all connected clients
        clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error('Error broadcasting file update:', error);
      }
    }
  });

  // API endpoints
  app.get('/api/files', async (req, res) => {
    try {
      const files = await getAllFiles(watchDir);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/config', (req, res) => {
    res.json(config);
  });

  app.post('/api/generate', async (req, res) => {
    try {
      const { files, name, description } = req.body;
      const result = await generateContentFile({
        watchDir,
        files,
        name,
        description,
        config
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return server;
}
