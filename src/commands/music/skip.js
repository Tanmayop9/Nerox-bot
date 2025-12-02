/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Skip to next track
 */

import { Command } from '../../classes/abstract/command.js';

export default class Skip extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['next', 's'];
        this.description = 'Skip to the next track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (player.queue.length === 0 && !player.data.get('autoplayStatus')) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`No more tracks in queue`')],
                });
            }

            const skipped = player.queue.current;
            await player.shoukaku.stopTrack();

            await ctx.reply({
                embeds: [
                    client.embed().desc(`Skipped **${skipped.title.substring(0, 40)}**`)
                ],
            });
        };
    }
}
