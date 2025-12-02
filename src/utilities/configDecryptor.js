/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Config loader (encryption temporarily disabled)
 */

import { readFileSync } from 'fs';

/**
 * Load configuration from file
 * Note: Encryption is temporarily disabled
 */
export const decryptConfig = (configFile) => {
    try {
        const data = readFileSync(configFile, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading config:', error.message);
        return {};
    }
};
