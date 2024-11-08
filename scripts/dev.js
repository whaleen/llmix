// scripts/dev.js
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Configuration
const SERVER_PORT = 3001;  // Backend server port
const UI_PORT = 5173;      // Vite dev server port

console.log(chalk.blue('Starting development servers...'));

// Start the backend server
const startServer = () => {
  console.log(chalk.yellow('Starting backend server...'));

  // Important: Use the ES module flag since we're using ES modules
  const server = spawn('node', ['--experimental-specifier-resolution=node', 'src/server/index.js'], {
    env: {
      ...process.env,
      PORT: SERVER_PORT.toString(),
      NODE_ENV: 'development'
    },
    stdio: 'inherit',
    cwd: rootDir
  });

  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      console.error(chalk.red('Failed to start server:'), err);
      reject(err);
    });

    // Wait a bit to ensure server is started
    setTimeout(() => {
      if (!server.killed) {
        console.log(chalk.green('Backend server started successfully'));
        resolve(server);
      }
    }, 1000);
  });
};

// Start Vite dev server
const startVite = () => {
  console.log(chalk.yellow('Starting Vite dev server...'));

  const vite = spawn('vite', [], {
    env: {
      ...process.env,
      VITE_SERVER_PORT: SERVER_PORT.toString()
    },
    stdio: 'inherit',
    cwd: rootDir,
    shell: true
  });

  vite.on('error', (err) => {
    console.error(chalk.red('Failed to start Vite:'), err);
    process.exit(1);
  });

  return vite;
};

// Handle process cleanup
const cleanup = (processes) => {
  console.log(chalk.yellow('\nShutting down development servers...'));

  processes.forEach(proc => {
    if (proc && !proc.killed) {
      proc.kill();
    }
  });
};

// Main
const main = async () => {
  const processes = [];

  try {
    // Start backend server first and wait for it to be ready
    const server = await startServer();
    processes.push(server);

    // Start Vite
    const vite = startVite();
    processes.push(vite);

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      cleanup(processes);
      process.exit();
    });

    process.on('SIGTERM', () => {
      cleanup(processes);
      process.exit();
    });

  } catch (error) {
    console.error(chalk.red('Error starting development servers:'), error);
    cleanup(processes);
    process.exit(1);
  }
};

main().catch(error => {
  console.error(chalk.red('Unhandled error:'), error);
  process.exit(1);
});
