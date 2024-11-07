
// src/cli/index.js
import { program } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';
import open from 'open';
import { loadConfig, setupWatcher, getAllFiles } from './utils.js';
import { startServer } from '../server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load config
  const config = await loadConfig(process.cwd());

  // CLI configuration
  program
    .name('llmix')
    .description('Generate LLM-friendly content files from your repository')
    .option('-p, --port <number>', 'port to run on', config.ui?.port || '3000')
    .option('-d, --dir <path>', 'directory to watch', process.cwd())
    .option('--no-open', 'don\'t open browser automatically')
    .parse();

  const options = program.opts();
  const port = parseInt(options.port, 10);
  const watchDir = path.resolve(options.dir);

  // Start the server
  const server = await startServer({
    port,
    watchDir,
    config
  });

  // Nice console output
  const url = `http://localhost:${port}`;
  const message = [
    `${chalk.bold('LLMix')} is running!`,
    '',
    `${chalk.bold('Watching:')} ${chalk.blue(watchDir)}`,
    `${chalk.bold('Web UI:')} ${chalk.blue(url)}`,
    '',
    `Press ${chalk.cyan('Ctrl+C')} to stop`
  ].join('\n');

  console.log(boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green'
  }));

  // Open browser unless disabled
  if (options.open) {
    open(url);
  }

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\nShutting down LLMix...'));
    server.close(() => {
      console.log(chalk.green('Goodbye! 👋'));
      process.exit(0);
    });
  });
}

main().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});

// src/cli/utils.js
import { cosmiconfig } from 'cosmiconfig';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';

export async function loadConfig(dir) {
  const explorer = cosmiconfig('llmix');
  try {
    const result = await explorer.search(dir);
    return result?.config || {};
  } catch (error) {
    console.warn('Warning: Error loading config file:', error.message);
    return {};
  }
}

export function setupWatcher(dir, config) {
  return chokidar.watch(dir, {
    ignored: [
      /(^|[\/\\])\../, // dotfiles
      ...(config.ignore || [])
    ],
    persistent: true
  });
}

export async function getAllFiles(dir) {
  const files = [];

  async function scan(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dir, fullPath);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          await scan(fullPath);
        }
      } else {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }
  }

  await scan(dir);
  return files;
}
