/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Main bot entry point
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAntiCrash } from '../../infrastructure/handlers/ErrorHandler.js';
import { ExtendedClient } from '../client/ExtendedClient.js';
import { initializeSecurity, distributedCheck, securityCheckpoint } from '../../security/SecuritySystem.js';

// Load Environment Variables
config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../../../../..');

console.clear();

// ═══════════════════════════════════════════════════════════════
// SECURITY SYSTEM - MUST BE INITIALIZED FIRST
// ═══════════════════════════════════════════════════════════════
const securityResult = await initializeSecurity({ projectRoot });
if (!securityResult.success) {
    console.error('Security initialization failed. Exiting...');
    process.exit(1);
}

// Distributed security check - verifies security system is running
distributedCheck('ENGINE_RUNNER_INIT');

// Load anti-crash handler
loadAntiCrash();

// Security checkpoint verification
securityCheckpoint();

// Initialize and connect the client
const client = new ExtendedClient();
export default client.connectToGateway();
