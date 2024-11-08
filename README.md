# LLMix

When working with AI language models, sharing the right context from your codebase is crucial but often cumbersome. Developers frequently find themselves manually copying and pasting multiple files or code snippets to provide adequate context for their queries. LLMix streamlines this process by providing a visual interface to organize and prepare your code for AI interactions.

With LLMix, you can create focused groups of related files from your repository, add descriptive context, and generate properly formatted content files that are optimized for AI consumption. Instead of juggling multiple files or losing track of which code snippets are relevant, you can drag and drop files into logical groups, add descriptions for better context, and generate a single, well-formatted file that contains everything an AI needs to understand your code.

For example, when discussing a bug with an AI, you can quickly group your component file, its tests, and related utilities, add a description of the issue, and generate a complete context file. This ensures the AI has all the necessary information without the noise of unrelated code.

## Installation

```bash
npm install llmix
```

## Quick Start

```bash
cd your-project
npx llmix
```

This will start both the backend server (port 3001) and the development UI server (port 5173). The web interface will open automatically in your default browser.

# Development with npm link

If you're developing or testing LLMix across different directories, you can use npm link. Here's how:

1. Create a global link in the LLMix project:

```bash
# In the LLMix directory
npm link
```

2. Link LLMix in your test directory:

```bash
# In your test directory
npm link llmix
```

3. Run LLMix:

```bash
npx llmix
```

To unlink when you're done:

```bash
# In your test directory
npm unlink llmix

# In the LLMix directory
npm unlink -g
```

### Development Mode

When developing LLMix, you can run it in development mode:

```bash
npm run dev
```

This starts:

- Backend server on port 3001
- Vite dev server with hot reloading on port 5173

For production builds:

```bash
npm run build
```

### UI Development

You can edit the UI while llmix is running:

1. Start the development servers:

```bash
npm run dev
```

2. Make changes to your UI files
3. Changes will automatically reload in your browser at http://localhost:5173

## Configuration

LLMix works out of the box with sensible defaults. To customize its behavior, create a `llmix.config.js` (or `.llmixrc.json`) in your project root:

```javascript
module.exports = {
  // UI settings
  ui: {
    port: 3001, // Backend server port
    openBrowser: true, // Whether to open browser on startup
  },

  // Files to ignore (in addition to .gitignore)
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
```

### Configuration Options

#### `ui`

- `port` (number): Port for the backend server. Defaults to 3001.
- `openBrowser` (boolean): Whether to open browser when starting. Defaults to true.

#### `ignore`

Array of patterns to ignore (in addition to .gitignore). Common patterns are ignored by default:

- `node_modules`
- `.git`
- `dist`/`build`
- `coverage`
- `.env` files
- Log files

#### `output`

- `directory`: Where to store generated files. Defaults to `.llmix`
- `fileNamePattern`: Pattern for generated filenames. Available variables:
  - `{name}`: Group name
  - `{timestamp}`: Generation time

### Generated Files

LLMix stores all generated files and data in the `.llmix` directory:

```
your-project/
  ├── .llmix/                   # All LLMix data
  │   ├── content-groups.json   # Your saved groups
  │   ├── history.json         # Generation history
  │   └── generated/           # Generated content files
  ├── llmix.config.js          # Optional config file
  └── ... your project files
```

Tip: Add `.llmix` to your `.gitignore` if you don't want to commit generated files.

## Usage

Just run `llmix` in your project directory:

```bash
npx llmix [options]

Options:
  -p, --port <number>  Override configured port
  --no-open            Don't open browser automatically
  -h, --help          Display help
```

The web UI will let you:

- View repository files
- Create content groups
- Drag and drop relevant files
- Generate formatted content for AI interactions

## Examples

### 1. Basic Usage - Bug Investigation

Let's say you're debugging an authentication issue. Create a content group with relevant files:

1. Start LLMix:

```bash
npx llmix
```

2. In the web UI:
   - Create a new group named "Auth Bug"
   - Add relevant files:
     - `src/auth/login.js`
     - `src/auth/validate.js`
     - `tests/auth.test.js`
   - Add description: "Login flow fails for users with long email addresses"
   - Click "Generate"

Generated output will look like:

```
###
# Content Group: Auth Bug
# Description: Login flow fails for users with long email addresses
# Generated: 2024-03-07T15:30:00Z
# Files: 3
###

### File: src/auth/login.js ###
[file content here]

### File: src/auth/validate.js ###
[file content here]

### File: tests/auth.test.js ###
[file content here]
```

### 2. Common Configuration Examples

#### Development Server Port Conflict

If you're running a dev server on port 3000, configure a different port:

```javascript
// llmix.config.js
module.exports = {
  ui: {
    port: 3999, // Use different port
  },
}
```

#### Monorepo Setup

For a monorepo, you might want to ignore certain packages:

```javascript
module.exports = {
  ignore: [
    'packages/*/node_modules',
    'packages/*/dist',
    'packages/internal-*', // Ignore internal packages
    '**/test/**', // Ignore all test directories
    '*.test.*', // Ignore all test files
  ],
}
```

#### Custom Output Organization

Organize output files by date:

```javascript
module.exports = {
  output: {
    directory: '.llmix',
    // Groups files by YYYY/MM/DD
    fileNamePattern:
      '{timestamp:YYYY}/{timestamp:MM}/{timestamp:DD}/{name}.txt',
  },
}
```

## Best Practices

1. **Focused Groups**: Create small, focused groups around specific features or issues
2. **Clear Descriptions**: Add detailed descriptions to provide context
3. **Related Files**: Include only directly relevant files
4. **Ignore Patterns**: Configure ignore patterns to exclude unnecessary files
5. **File Organization**: Use meaningful group names for easy reference
