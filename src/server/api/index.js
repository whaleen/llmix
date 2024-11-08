// src/server/api/index.js
import { setupFilesAPI } from './files.js';
import { setupConfigAPI } from './config.js';
import { setupGenerateAPI } from './generate.js';
import { setupGroupsAPI } from './groups.js';

export function setupAPI(app, options) {
  setupFilesAPI(app, options);
  setupConfigAPI(app, options);
  setupGenerateAPI(app, options);
  setupGroupsAPI(app, options);
}
