// src/server/api/generate.js
import { generateContentFile } from '../fileUtils.js';

export function setupGenerateAPI(app, { watchDir, config, storage }) {
  app.post('/api/generate', async (req, res) => {
    try {
      const { files, name, description, groupId } = req.body;
      console.log('Generate request:', { files, name, description, groupId }); // Debug log

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

      console.log('Generated file result:', result); // Debug log

      // Add to group history if successful
      if (result.success) {
        await storage.addGenerationToHistory(groupId, result.path);
      }

      res.json(result);
    } catch (error) {
      console.error('Error in generate endpoint:', error);
      res.status(500).json({
        error: 'Failed to generate content file',
        details: error.message
      });
    }
  });
}
