// src/server/api/config.js
export function setupConfigAPI(app, { config }) {
  app.get('/api/config', (req, res) => {
    try {
      // Only send necessary config data to client
      const clientConfig = {
        ignore: config.ignore || [],
        output: {
          directory: config.output?.directory || '.llmix',
          fileNamePattern: config.output?.fileNamePattern || '{name}-{timestamp}.txt'
        }
      };
      res.json(clientConfig);
    } catch (error) {
      console.error('Error getting config:', error);
      res.status(500).json({
        error: 'Failed to retrieve config',
        details: error.message
      });
    }
  });
}
