// src/cli/index.js
import { program } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import boxen from 'boxen';
import open from 'open';
import { loadConfig } from './utils.js';
import { startServer } from '../server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // Load config
  const config = await loadConfig(process.cwd());

  // CLI configuration
  program
    .name('llmix')
    .description('Generate LLM-friendly content files from your repository')
    .option('-p, --port <number>', 'port to run on', config.ui?.port || '3000')
    .option('-d, --dir <path>', 'directory to watch', process.cwd())
    .option('--no-open', 'don\'t open browser automatically')
    .parse();

  const options = program.opts();
  const port = parseInt(options.port, 10);
  const watchDir = path.resolve(options.dir);

  try {
    // Start the server
    const { cleanup } = await startServer({
      port,
      watchDir,
      config
    });

    // Nice console output
    const url = `http://localhost:${port}`;
    const message = [
      `${chalk.bold.greenBright('🚀 LLMix is up and running! 🚀')}`,
      '',
      `${chalk.bold.yellow('👀 Watching:')} ${chalk.blue.bold(watchDir)}`,
      `${chalk.bold.yellow('🌐 Web UI:')} ${chalk.cyan.bold(url)}`,
      '',
      `${chalk.magenta('💡 Tip:')} Press ${chalk.cyan.bold('Ctrl+C')} to stop`,
      '',
      `${chalk.gray('─────────────────────────────')}`,
      `${chalk.bold.greenBright('🔥 Enjoy your LLMix experience! 🔥')}`,
    ].join('\n');

    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyanBright',
      backgroundColor: 'black'
    }));

    // Open browser unless disabled
    if (options.open) {
      await open(url);
    }

    // Handle shutdown
    process.on('SIGINT', async () => {
      // Let the server's cleanup function handle all messages
      await cleanup();
    });

  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

main();
