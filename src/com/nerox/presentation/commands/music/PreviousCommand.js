/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Play previous song
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Previous extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['prev', 'back'];
        this.description = 'Play the previous song';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            // Check if we have previous tracks
            if (!player.queue.previous || player.queue.previous.length === 0) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No previous tracks available.`)],
                });
            }

            // Get previous track
            const previousTrack = player.queue.previous.pop();

            // Add current track to front of queue
            if (player.queue.current) {
                player.queue.unshift(player.queue.current);
            }

            // Add previous track to front
            player.queue.unshift(previousTrack);

            // Stop current track to trigger next
            if (player.shoukaku?.stopTrack) {
                await player.shoukaku.stopTrack();
            } else if (player.skip) {
                await player.skip();
            } else if (player.audioPlayer) {
                player.audioPlayer.stop();
            }

            // Remove the duplicate from previous
            if (player.queue.previous.length > 0) {
                player.queue.previous.pop();
            }

            await ctx.reply({
                embeds: [
                    client.embed().desc(`${client.emoji.previous} Playing **${previousTrack.title.substring(0, 40)}**`),
                ],
            });
        };
    }
}
