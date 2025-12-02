/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Loop command - Toggle loop modes
 */

import { Command } from '../../framework/abstract/command.js';

export default class Loop extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['repeat', 'lp'];
        this.description = 'Toggle loop mode (track/queue/off)';
        this.options = [
            {
                name: 'mode',
                required: false,
                opType: 'string',
                description: 'Loop mode: track, queue, or off',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const player = client.getPlayer(ctx);

            const modes = {
                off: 'none',
                none: 'none',
                track: 'track',
                song: 'track',
                current: 'track',
                queue: 'queue',
                all: 'queue',
            };

            // If mode specified, set it
            if (args.length > 0) {
                const requestedMode = args[0].toLowerCase();
                const mode = modes[requestedMode];

                if (!mode) {
                    return await ctx.reply({
                        embeds: [
                            client
                                .embed()
                                .desc(`${client.emoji.cross} Invalid mode. Use: \`track\`, \`queue\`, or \`off\``),
                        ],
                    });
                }

                player.setLoop(mode);
                player.loop = mode;

                const modeText = mode === 'none' ? 'disabled' : `set to **${mode}**`;
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.repeat} Loop ${modeText}`)],
                });
            }

            // Toggle through modes: none -> track -> queue -> none
            const currentLoop = player.loop || 'none';
            let newLoop;

            switch (currentLoop) {
                case 'none':
                    newLoop = 'track';
                    break;
                case 'track':
                    newLoop = 'queue';
                    break;
                case 'queue':
                    newLoop = 'none';
                    break;
                default:
                    newLoop = 'track';
            }

            player.setLoop(newLoop);
            player.loop = newLoop;

            const emoji = newLoop === 'none' ? client.emoji.cross : client.emoji.repeat;
            const text = newLoop === 'none' ? 'Loop disabled' : `Looping **${newLoop}**`;

            await ctx.reply({
                embeds: [client.embed().desc(`${emoji} ${text}`)],
            });
        };
    }
}
