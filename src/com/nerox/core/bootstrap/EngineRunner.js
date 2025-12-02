/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Main bot entry point
 */

import { loadAntiCrash } from '../../infrastructure/handlers/ErrorHandler.js';
import { ExtendedClient } from '../client/ExtendedClient.js';

console.clear();

// Load anti-crash handler
loadAntiCrash();

// Initialize and connect the client
const client = new ExtendedClient();
export default client.connectToGateway();
