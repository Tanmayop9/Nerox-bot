/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Skip to next track
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Skip extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['next', 's', 'sk'];
        this.description = 'Skip to the next track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            if (player.queue.length === 0 && !player.data?.get('autoplayStatus')) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.info} No more tracks in queue.`)],
                });
            }

            const skipped = player.queue.current;

            // Works with both Lavalink and NeroxPlayer
            if (player.shoukaku?.stopTrack) {
                await player.shoukaku.stopTrack();
            } else if (player.skip) {
                await player.skip();
            } else if (player.audioPlayer) {
                player.audioPlayer.stop();
            }

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `${client.emoji.check} Skipped **${skipped?.title?.substring(0, 40) || 'current track'}**`
                        ),
                ],
            });
        };
    }
}
