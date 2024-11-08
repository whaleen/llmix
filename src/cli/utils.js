// src/cli/utils.js
import { cosmiconfig } from 'cosmiconfig';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { minimatch } from 'minimatch';

export async function loadConfig(dir) {
  const explorer = cosmiconfig('llmix', {
    searchPlaces: [
      'package.json',
      '.llmixrc',
      '.llmixrc.json',
      '.llmixrc.js',
      'llmix.config.js',
      'llmix.config.json'
    ],
    ignoreEmptySearchPlaces: true,
    stopDir: dir
  });

  try {
    const result = await explorer.search(dir);
    return result?.config || {};
  } catch (error) {
    if (error.message.includes('typescript')) {
      // Ignore TypeScript-related errors
      return {};
    }
    console.warn('Warning: Error loading config file:', error.message);
    return {};
  }
}

function shouldIgnore(file, ignorePatterns) {
  return ignorePatterns.some(pattern => {
    try {
      return minimatch(file, pattern, { dot: true });
    } catch (err) {
      console.warn(`Invalid ignore pattern: ${pattern}`);
      return false;
    }
  });
}

export function setupWatcher(dir, config) {
  const defaultIgnore = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.env*',
    '**/*.log'
  ];

  const ignorePatterns = [...defaultIgnore, ...(config.ignore || [])];

  return chokidar.watch(dir, {
    ignored: (file) => {
      const relativePath = path.relative(dir, file);
      return shouldIgnore(relativePath, ignorePatterns);
    },
    persistent: true,
    ignoreInitial: false
  });
}

export async function getAllFiles(dir) {
  const files = [];
  const config = await loadConfig(dir);

  const defaultIgnore = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.env*',
    '**/*.log'
  ];

  const ignorePatterns = [...defaultIgnore, ...(config.ignore || [])];

  async function scan(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dir, fullPath);

      if (shouldIgnore(relativePath, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }
  }

  await scan(dir);
  return files;
}
