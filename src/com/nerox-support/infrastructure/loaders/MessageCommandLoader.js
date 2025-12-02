/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Message command loader for support bot
 */

import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const loadCommands = async (client) => {
    let total = 0;

    for (const category of await readdir(resolve(__dirname, '../../presentation/commands'))) {
        for (const file of await readdir(resolve(__dirname, '../../presentation/commands', category))) {
            if (!file.endsWith('.js')) continue;

            const command = new (
                await import(pathToFileURL(resolve(__dirname, '../../presentation/commands', category, file)).href)
            ).default();

            command.name = file.replace('Command.js', '').toLowerCase();
            command.category = category;

            client.commands.set(command.name, command);
            total++;
        }
    }

    client.log(`Loaded ${total} commands`, 'success');
};
