/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Main entry point for support bot (with optional clustering)
 */

import { config } from 'dotenv';
import { log } from '../logging/LoggerService.js';

// Load Environment Variables
config();

// Validate token
if (!process.env.SUPPORT_BOT_TOKEN) {
    console.error('ERROR: SUPPORT_BOT_TOKEN is not set in environment variables!');
    process.exit(1);
}

log('NeroX Support Bot v1.0.0 starting...', 'info');

// Import and run the engine directly (no clustering for simplicity)
import('./EngineRunner.js');
