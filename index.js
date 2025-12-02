/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Main entry point - Runs both Nerox Music Bot and Support Bot
 */

import { fork } from 'child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';

// Load environment variables
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bot configurations
const bots = [
    {
        name: 'Nerox Music Bot',
        path: resolve(__dirname, 'src/com/nerox/core/bootstrap/GatewayApplication.js'),
        token: process.env.DISCORD_TOKEN,
        color: '\x1b[36m', // Cyan
    },
    {
        name: 'Nerox Support Bot',
        path: resolve(__dirname, 'src/com/nerox-support/core/bootstrap/SupportApplication.js'),
        token: process.env.SUPPORT_BOT_TOKEN,
        color: '\x1b[35m', // Magenta
    },
];

const reset = '\x1b[0m';
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const gray = '\x1b[90m';

const timestamp = () => gray + `[${new Date().toLocaleTimeString()}]` + reset;

console.log(`
${green}╔═══════════════════════════════════════════════════════════════╗
║                    NEROX BOT LAUNCHER v4.0.0                   ║
║                    © NeroX Studios - Tanmay                    ║
╚═══════════════════════════════════════════════════════════════╝${reset}
`);

const processes = new Map();

// Start a bot process
function startBot(bot) {
    if (!bot.token) {
        console.log(`${timestamp()} ${yellow}[SKIP]${reset} ${bot.name} - Token not configured`);
        return null;
    }

    console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} Starting...`);

    const child = fork(bot.path, [], {
        stdio: ['inherit', 'pipe', 'pipe', 'ipc'],
        env: process.env,
    });

    // Handle stdout
    child.stdout?.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} ${line}`);
            }
        });
    });

    // Handle stderr
    child.stderr?.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach((line) => {
            if (line.trim()) {
                console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} ${red}${line}${reset}`);
            }
        });
    });

    // Handle exit
    child.on('exit', (code, _signal) => {
        console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} ${red}Exited with code ${code}${reset}`);
        processes.delete(bot.name);

        // Auto-restart after 5 seconds if crashed
        if (code !== 0 && code !== null) {
            console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} ${yellow}Restarting in 5 seconds...${reset}`);
            setTimeout(() => {
                const newProcess = startBot(bot);
                if (newProcess) processes.set(bot.name, newProcess);
            }, 5000);
        }
    });

    // Handle errors
    child.on('error', (error) => {
        console.log(`${timestamp()} ${bot.color}[${bot.name}]${reset} ${red}Error: ${error.message}${reset}`);
    });

    return child;
}

// Start all bots
for (const bot of bots) {
    const child = startBot(bot);
    if (child) {
        processes.set(bot.name, child);
    }
}

// Handle main process signals
process.on('SIGINT', () => {
    console.log(`\n${timestamp()} ${yellow}[LAUNCHER]${reset} Shutting down all bots...`);

    for (const [name, child] of processes) {
        console.log(`${timestamp()} ${yellow}[LAUNCHER]${reset} Stopping ${name}...`);
        child.kill('SIGTERM');
    }

    setTimeout(() => {
        console.log(`${timestamp()} ${green}[LAUNCHER]${reset} All bots stopped. Goodbye!`);
        process.exit(0);
    }, 2000);
});

process.on('SIGTERM', () => {
    process.emit('SIGINT');
});

// Keep the main process alive
process.on('uncaughtException', (error) => {
    console.log(`${timestamp()} ${red}[LAUNCHER]${reset} Uncaught exception: ${error.message}`);
});

process.on('unhandledRejection', (error) => {
    console.log(`${timestamp()} ${red}[LAUNCHER]${reset} Unhandled rejection: ${error?.message || error}`);
});

console.log(`${timestamp()} ${green}[LAUNCHER]${reset} Bot launcher initialized`);
console.log(`${timestamp()} ${green}[LAUNCHER]${reset} Press Ctrl+C to stop all bots\n`);
