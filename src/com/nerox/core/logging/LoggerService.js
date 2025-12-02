/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Professional logging utility
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
    const config = logTypes[type] || logTypes.info;
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });

    console.log(chalk.gray(`[${timestamp}]`), config.color(`[${config.prefix}]`), message);
};

export default log;
