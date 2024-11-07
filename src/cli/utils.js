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
