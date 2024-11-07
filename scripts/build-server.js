import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

async function buildServer() {
  try {
    await build({
      entryPoints: [
        'src/cli/index.js',
        'src/server/index.js',
        'src/server/fileUtils.js'
      ],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outbase: 'src',
      outdir: 'dist',
      external: [
        'express',
        'ws',
        'react',
        'react-dom',
        'path',
        'fs',
        'fs/promises',
        'url',
        'commander',
        'chalk',
        'boxen',
        'chokidar',
        'cosmiconfig',
        'open'
      ],
    });
    console.log('Server build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();
