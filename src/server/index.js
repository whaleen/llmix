// src/server/index.js
import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { setupWatcher, getAllFiles } from '../cli/utils.js';
import { generateContentFile } from './fileUtils.js';
import { Storage } from './storage.js';
import { setupGroupsAPI } from './api/groups.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer({ port = process.env.PORT || 3001, watchDir = process.cwd(), config = {} } = {}) {
  console.log(chalk.cyan(`Starting server on port ${port}...`));

  const app = express();
  const watcher = setupWatcher(watchDir, config);
  const storage = new Storage(watchDir);

  // Initialize storage
  await storage.init();

  let isShuttingDown = false;

  // API endpoints must come BEFORE static file serving
  app.use(express.json());

  // Setup all API routes first
  setupGroupsAPI(app, { storage });

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
      const { files, name, description, groupId } = req.body;

      // Validate request
      if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          error: 'Files array is required and must not be empty'
        });
      }

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          error: 'Name is required and must be a string'
        });
      }

      if (!groupId) {
        return res.status(400).json({
          error: 'Group ID is required'
        });
      }

      // Ensure group directory exists
      await storage.createGroupDirectory(groupId);

      const result = await generateContentFile({
        watchDir,
        files,
        name,
        description,
        config,
        groupId
      });

      // Add to group history if successful
      if (result.success) {
        await storage.addGenerationToHistory(groupId, result.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({
        error: 'Failed to generate content file',
        details: error.message,
        stack: error.stack
      });
    }
  });

  // Create HTTP server explicitly to attach WebSocket server
  const server = app.listen(port, () => {
    console.log(chalk.green(`✓ Server running on http://localhost:${port}`));
  });

  // Setup WebSocket server with explicit path
  // Setup WebSocket server
  const wss = new WebSocketServer({
    server,
    path: '/ws',
    clientTracking: true
  });

  // Add error handler for the WebSocket server
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Log when the WebSocket server is ready
  wss.on('listening', () => {
    console.log(chalk.green('✓ WebSocket server ready'));
  });

  // Track active connections and setup ping/pong
  const clients = new Set();
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('Terminating inactive client');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 3000);

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    clients.add(ws);
    console.log('Client connected');

    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Send initial file list and groups
    Promise.all([
      getAllFiles(watchDir),
      storage.getGroups()
    ]).then(([files, groups]) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'files',
          files
        }));
        ws.send(JSON.stringify({
          type: 'groups',
          groups
        }));
      }
    }).catch(error => {
      console.error('Error sending initial data:', error);
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
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

        clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            try {
              client.send(message);
            } catch (error) {
              console.error('Error sending to client:', error);
              clients.delete(client);
            }
          }
        });
      } catch (error) {
        console.error('Error broadcasting file update:', error);
      }
    }
  });

  // Static file serving
  app.use('/.llmix', express.static(path.join(watchDir, '.llmix')));
  app.use(express.static(path.join(__dirname, '../ui')));

  // Catch-all route MUST be last
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../ui/index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });

  // Cleanup function for graceful shutdown
  const cleanup = async () => {
    if (isShuttingDown) {
      return; // Prevent multiple shutdowns
    }
    isShuttingDown = true;

    console.log(chalk.yellow('\nShutting down LLMix...'));

    // Clear the ping interval
    clearInterval(pingInterval);

    // Close all WebSocket connections
    wss.clients.forEach(client => {
      client.terminate();
    });

    // Close the WebSocket server
    await new Promise(resolve => {
      wss.close(() => resolve());
    });

    // Stop the file watcher
    await watcher.close();

    // Close the HTTP server with a timeout
    const httpServerClosed = new Promise((resolve) => {
      server.close(() => resolve());
    });

    // Force close after 3 seconds if server hasn't closed
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve(), 3000);
    });

    await Promise.race([httpServerClosed, timeoutPromise]);
    console.log(chalk.green('Goodbye! 👋'));
    process.exit(0);
  };

  // Setup cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return {
    httpServer: server,
    wsServer: wss,
    watcher,
    storage,
    cleanup
  };
}

// If this file is run directly (not imported), start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3001', 10);
  startServer({ port })
    .then(() => {
      console.log(chalk.blue('Server initialization complete'));
    })
    .catch((error) => {
      console.error(chalk.red('Failed to start server:'), error);
      process.exit(1);
    });
}
