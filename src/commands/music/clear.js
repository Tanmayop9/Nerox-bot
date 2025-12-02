/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Clear queue or filters
 */

import { Command } from '../../classes/abstract/command.js';

export default class Clear extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.usage = '<queue/filters>';
        this.aliases = ['clr'];
        this.description = 'Clear queue or filters';
        this.options = [
            {
                name: 'option',
                required: true,
                opType: 'string',
                choices: [
                    { name: 'queue', value: 'q' },
                    { name: 'filters', value: 'f' },
                ],
                description: 'What to clear (queue or filters)',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            const option = args[0]?.toLowerCase();

            switch (option) {
                case 'q':
                case 'queue': {
                    const count = player.queue.length;
                    player.queue.splice(0, player.queue.length);
                    await ctx.reply({
                        embeds: [
                            client.embed().desc(`${client.emoji.check} Cleared **${count}** tracks from the queue.`),
                        ],
                    });
                    break;
                }

                case 'f':
                case 'filters': {
                    // Check if Lavalink player with filter support
                    if (player.shoukaku?.clearFilters) {
                        const reply = await ctx.reply({
                            embeds: [
                                client
                                    .embed()
                                    .desc(`${client.emoji.timer} Please wait while I clear all applied filters.`),
                            ],
                        });

                        await player.shoukaku.clearFilters();
                        await client.sleep(2);

                        await reply.edit({
                            embeds: [client.embed().desc(`${client.emoji.check} Filters cleared successfully.`)],
                        });
                    } else {
                        await ctx.reply({
                            embeds: [
                                client
                                    .embed()
                                    .desc(`${client.emoji.info} Filters are not available with the current player.`),
                            ],
                        });
                    }
                    break;
                }

                default:
                    await ctx.reply({
                        embeds: [client.embed().desc(`${client.emoji.cross} Please specify: \`queue\` or \`filters\``)],
                    });
                    break;
            }
        };
    }
}
