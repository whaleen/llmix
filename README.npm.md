# LLMix

Generate LLM-friendly content files from your repository. LLMix helps you organize and prepare your code for interactions with AI language models.

## Installation

Install globally:

```bash
npm install -g llmix
```

Or as a project dependency:

```bash
npm install llmix
```

## Quick Start

1. Navigate to your project:

```bash
cd your-project
```

2. Run LLMix:

```bash
npx llmix
```

The web UI will open automatically (default: http://localhost:3001)

## Configuration

Create `llmix.config.js` in your project root:

```javascript
module.exports = {
  // UI settings
  ui: {
    port: 3001,
    openBrowser: true,
  },

  // Files to ignore (in addition to .gitignore)
  ignore: ['node_modules', '.git', 'dist', 'build', 'coverage'],

  // Output settings
  output: {
    directory: '.llmix',
    fileNamePattern: '{name}-{timestamp}.txt',
  },
}
```

## Usage

### CLI Options

```bash
npx llmix [options]

Options:
  -p, --port <number>  Override configured port
  --no-open            Don't open browser automatically
  -h, --help          Display help
```

### Programmatic Usage

```javascript
import { createStore } from 'llmix'

// Initialize store
const store = await createStore('./my-project')

// Generate content
await store.generateContentFile({
  name: 'Auth Feature',
  description: 'Authentication related files',
  files: ['src/auth.js', 'src/login.js'],
})
```

## Example Output

```
###
# Content Group: Auth Feature
# Description: Authentication related files
# Generated: 2024-03-07T15:30:00Z
# Files: 2
###

### File: src/auth.js ###
[file content here]

### File: src/login.js ###
[file content here]
```

## Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

## More Information

- [Full Documentation](https://github.com/whaleen/llmix)
- [Contributing](https://github.com/whaleen/llmix/blob/main/CONTRIBUTING.md)
- [Issues](https://github.com/whaleen/llmix/issues)

## License

MIT
