/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Database provider for support bot with main bot database access
 */

import JOSH from '@joshdb/core';
// @ts-expect-error no declaration file for the imported module
import provider from '@joshdb/json';

// Support bot's own database
export const josh = (name) => {
    return new JOSH({
        name,
        provider,
        providerOptions: {
            dataDir: `./database-storage/support/${name}`,
        },
    });
};

// Main Nerox bot's database (for granting premium/noPrefix to giveaway winners)
export const mainBotJosh = (name) => {
    return new JOSH({
        name,
        provider,
        providerOptions: {
            dataDir: `./database-storage/${name}`,
        },
    });
};
