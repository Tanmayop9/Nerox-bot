/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Event loader
 */

import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const loadEvents = async (client) => {
    let total = 0;

    for (const folder of await readdir(resolve(__dirname, '../../presentation/events/'))) {
        const subFolder = resolve(__dirname, `../../presentation/events/${folder}`);

        for (const file of await readdir(subFolder)) {
            if (!file.endsWith('.js')) continue;

            const module = await import(pathToFileURL(resolve(__dirname, subFolder, file)).href);

            // Handle multiple named exports (for voiceRecognition.js)
            for (const [exportName, ExportedClass] of Object.entries(module)) {
                if (exportName === 'default' || typeof ExportedClass !== 'function') continue;

                try {
                    const instance = new ExportedClass();
                    if (instance.name && typeof instance.execute === 'function') {
                        client.addListener(instance.name, async (...args) => await instance.execute(client, ...args));
                        total++;
                    }
                } catch {
                    // Not a class constructor, skip
                }
            }

            // Handle default export
            if (module.default && typeof module.default === 'function') {
                try {
                    const event = new module.default();
                    if (event.name && typeof event.execute === 'function') {
                        client.addListener(event.name, async (...args) => await event.execute(client, ...args));
                        total++;
                    }
                } catch {
                    // Not a class constructor, skip
                }
            }
        }
    }

    client.log(`Loaded ${total} events`, 'success');
};
