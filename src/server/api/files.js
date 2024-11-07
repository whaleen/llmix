// src/server/api/files.js
import { getAllFiles } from '../../cli/utils.js';

export async function setupFilesAPI(app, { watchDir }) {
  app.get('/api/files', async (req, res) => {
    try {
      const files = await getAllFiles(watchDir);
      res.json({ files });
    } catch (error) {
      console.error('Error getting files:', error);
      res.status(500).json({
        error: 'Failed to retrieve files',
        details: error.message
      });
    }
  });
}
