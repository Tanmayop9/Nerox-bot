/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Adjust player volume
 */

import { Command } from '../../classes/abstract/command.js';

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
            
            // Show current volume if no argument
            if (!args.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Volume: \`${player.volume}%\``)],
                });
            }

            const volume = Math.ceil(parseInt(args[0]));

            if (isNaN(volume) || volume < 1 || volume > 150) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Volume must be between 1-150`')],
                });
            }

            player.setVolume(volume);

            await ctx.reply({
                embeds: [client.embed().desc(`Volume: \`${volume}%\``)],
            });
        };
    }
}
