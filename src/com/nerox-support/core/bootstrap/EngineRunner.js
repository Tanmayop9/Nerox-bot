/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Engine runner for support bot
 */

import { config } from 'dotenv';
import { SupportClient } from '../client/SupportClient.js';
import { loadEvents } from '../../infrastructure/loaders/EventLoader.js';
import { loadCommands } from '../../infrastructure/loaders/MessageCommandLoader.js';
import { deploySlashCommands } from '../../infrastructure/loaders/SlashCommandLoader.js';

// Load environment variables
config();

const client = new SupportClient();

// Load commands and events
await loadCommands(client);
await loadEvents(client);

// Connect to Discord
client.connectToGateway();

// Deploy slash commands when ready
client.once('ready', async () => {
    await deploySlashCommands(client);
});

// Handle process errors
process.on('unhandledRejection', (error) => {
    client.log(`Unhandled rejection: ${error?.message || error}`, 'error');
});

process.on('uncaughtException', (error) => {
    client.log(`Uncaught exception: ${error?.message || error}`, 'error');
});
