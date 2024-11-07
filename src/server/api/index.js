// src/server/api/index.js
import { setupFilesAPI } from './files.js';
import { setupConfigAPI } from './config.js';
import { setupGenerateAPI } from './generate.js';

export function setupAPI(app, options) {
  setupFilesAPI(app, options);
  setupConfigAPI(app, options);
  setupGenerateAPI(app, options);
}
