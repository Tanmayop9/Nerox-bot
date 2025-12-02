/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Main bot entry point
 */

import { loadAntiCrash } from '../../infrastructure/handlers/ErrorHandler.js';
import { ExtendedClient } from '../client/ExtendedClient.js';
import { distributedCheck, securityCheckpoint } from '../../security/SecuritySystem.js';

console.clear();

// Distributed security check - verifies security system is running
distributedCheck('ENGINE_RUNNER_INIT');

// Load anti-crash handler
loadAntiCrash();

// Security checkpoint verification
securityCheckpoint();

// Initialize and connect the client
const client = new ExtendedClient();
export default client.connectToGateway();
