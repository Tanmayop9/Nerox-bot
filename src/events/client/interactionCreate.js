/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Interaction handler for slash commands and autocomplete
 */

import { createContext } from '../../functions/contextFrom/interaction.js';

const event = 'interactionCreate';

export default class InteractionCreate {
    constructor() {
        this.name = event;
    }

    execute = async (client, interaction) => {
        if (!interaction || interaction.user?.bot) return;

        // Button interactions
        if (interaction.isButton()) {
            return void client.emit('buttonClick', interaction);
        }

        // Slash Commands
        if (interaction.isCommand()) {
            await interaction.deferReply().catch(() => null);
            return void client.emit('ctxCreate', await createContext(client, interaction));
        }

        // Autocomplete for music commands
        if (interaction.isAutocomplete()) {
            const commandName = interaction.commandName;
            const query = interaction.options.getString('query');

            if (['play', 'search'].includes(commandName) && query) {
                try {
                    const res = await client.manager.search(query, {
                        engine: 'youtube',
                        requester: interaction.user,
                    });

                    const songs = res.tracks?.slice(0, 10).map((track) => ({
                        name: track.title.substring(0, 100),
                        value: track.uri,
                    }));

                    if (songs?.length) {
                        await interaction.respond(songs);
                    }
                } catch (err) {
                    // Silently handle search errors
                }
            }
        }
    };
}
