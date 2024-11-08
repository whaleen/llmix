// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPort = process.env.VITE_SERVER_PORT || '3001';

// Helper to wait for server to be ready
const waitForServer = async () => {
  const timeout = 30000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${serverPort}/api/config`);
      if (response.ok) return true;
    } catch (e) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  throw new Error('Timeout waiting for backend server');
};

export default defineConfig(async () => {
  try {
    await waitForServer();
    console.log('✓ Backend server is ready');
  } catch (error) {
    console.error('Error connecting to backend server:', error);
    process.exit(1);
  }

  return {
    plugins: [react()],
    root: 'src/ui',
    build: {
      outDir: '../../dist/ui',
      emptyOutDir: true,
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true
        },
        '^/ws': {
          target: `ws://localhost:${serverPort}`,
          ws: true,
          changeOrigin: true
        }
      }
    }
  }
});
