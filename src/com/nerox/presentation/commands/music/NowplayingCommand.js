/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Now Playing Command - Shows current track information
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';
import { progressBar } from '../../../infrastructure/handlers/ProgressIndicator.js';

export default class NowPlaying extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['now', 'np', 'current'];
        this.description = 'Display information about the currently playing track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const track = player.queue.current;

            if (!track) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No track is currently playing.`)],
                });
            }

            const position = player.position || 0;
            const duration = track.length || track.duration || 0;
            const progress = duration > 0 ? progressBar(position, duration, 20) : '◉ LIVE';

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            '**Now Playing**\n\n' +
                                `${client.emoji.music} **${track.title}**\n` +
                                `${client.emoji.info} **Artist:** ${track.author || 'Unknown'}\n` +
                                `${client.emoji.info1} **Duration:** ${track.isStream ? '◉ LIVE' : `${client.formatDuration(position)} / ${client.formatDuration(duration)}`}\n\n` +
                                `${progress}`
                        )
                        .thumb(track.thumbnail || track.artworkUrl)
                        .footer({
                            text: `Requested by ${track.requester?.displayName || track.requester?.username || 'Unknown'}`,
                        }),
                ],
            });
        };
    }
}
