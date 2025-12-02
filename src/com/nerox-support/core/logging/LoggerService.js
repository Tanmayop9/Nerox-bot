/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Logging service for support bot
 */

import chalk from 'chalk';

const logTypes = {
    info: { color: chalk.blue, prefix: 'INFO' },
    success: { color: chalk.green, prefix: 'SUCCESS' },
    warn: { color: chalk.yellow, prefix: 'WARN' },
    error: { color: chalk.red, prefix: 'ERROR' },
    debug: { color: chalk.gray, prefix: 'DEBUG' },
};

export const log = (message, type = 'info') => {
    const logType = logTypes[type] || logTypes.info;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${chalk.gray(`[${timestamp}]`)} ${logType.color(`[${logType.prefix}]`)} ${message}`);
};
