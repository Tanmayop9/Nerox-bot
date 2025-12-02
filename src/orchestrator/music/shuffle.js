/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Shuffle the queue
 */

import { Command } from '../../framework/abstract/command.js';

export default class Shuffle extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['sh', 'mix'];
        this.description = 'Shuffle the queue';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player || player.queue.length === 0) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Queue is empty.`)],
                });
            }

            player.queue.shuffle();

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.shuffle} Shuffled **${player.queue.length}** tracks in the queue.`),
                ],
            });
        };
    }
}
