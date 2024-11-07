// src/server/api/generate.js
import { generateContentFile } from '../fileUtils.js';

export function setupGenerateAPI(app, { watchDir, config }) {
  app.post('/api/generate', async (req, res) => {
    try {
      const { files, name, description } = req.body;

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

      const result = await generateContentFile({
        watchDir,
        files,
        name,
        description,
        config
      });

      res.json(result);
    } catch (error) {
      console.error('Error generating content:', error);
      res.status(500).json({
        error: 'Failed to generate content file',
        details: error.message
      });
    }
  });
}
