/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Adjust player volume
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Volume extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['v', 'vol'];
        this.description = 'Adjust player volume';
        this.options = [
            {
                name: 'level',
                required: false,
                opType: 'string',
                description: 'Volume level (1-150)',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            // Show current volume if no argument
            if (!args.length) {
                const currentVolume = player.volume || 100;
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.volume} Current volume: **${currentVolume}%**`)],
                });
            }

            const volume = Math.ceil(parseInt(args[0]));

            if (isNaN(volume) || volume < 1 || volume > 150) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Volume must be between 1-150.`)],
                });
            }

            // Set volume (works with both Lavalink and NeroxPlayer)
            if (player.setVolume) {
                player.setVolume(volume);
            } else if (player.volume !== undefined) {
                player.volume = volume;
            }

            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.volume} Volume set to **${volume}%**`)],
            });
        };
    }
}
