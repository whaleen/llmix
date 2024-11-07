// llmix.config.ts
module.exports = {
  // UI settings
  ui: {
    port: 3000, // Default port (avoiding common dev server ports)
    openBrowser: true, // Open browser when starting
  },

  // Files and directories to ignore (in addition to .gitignore)
  ignore: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.env*',
    '*.log',
  ],

  // Output settings
  output: {
    directory: '.llmix', // Where to store generated files
    fileNamePattern: '{name}-{timestamp}.txt', // Format: my-group-2024-03-07-12-30-45.txt
  },
}
