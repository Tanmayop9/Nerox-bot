/**
 * @nerox v1.0.0
 * @author Tanmay
 * @description Now Playing Command - Shows current track information
 */

import { Command } from '../../classes/abstract/command.js';

export default class NowPlaying extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['now', 'np'];
        this.description = 'Display information about the currently playing track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const track = player.queue.current;

            await ctx.reply({
                embeds: [
                    client.embed()
                        .desc(
                            `${client.emoji.info1} **${track.title}**\n\n` +
                            `${client.emoji.info} **Duration:** ${track.isStream ? '◉ LIVE' : client.formatDuration(track.length)}\n` +
                            `${client.emoji.info} **Artist:** ${track.author}`
                        )
                        .footer({
                            text: `Requested by ${track.requester.displayName}`,
                        }),
                ],
            });
        };
    }
}
