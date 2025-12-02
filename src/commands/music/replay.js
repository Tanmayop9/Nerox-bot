/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Replay command - Restart the current track
 */

import { Command } from '../../classes/abstract/command.js';

export default class Replay extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['restart', 'again'];
        this.description = 'Restart the current track from beginning';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const track = player.queue.current;

            if (!track) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No track is currently playing.`)],
                });
            }

            // Seek to beginning or restart
            if (player.seek) {
                await player.seek(0);
            } else {
                // For NeroxPlayer, we need to stop and replay
                player.position = 0;
                await player.play();
            }

            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Replaying **${track.title.substring(0, 50)}**`)],
            });
        };
    }
}
