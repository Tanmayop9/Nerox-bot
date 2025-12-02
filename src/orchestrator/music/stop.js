/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Stop playback and disconnect
 */

import { Command } from '../../framework/abstract/command.js';

export default class Stop extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['end'];
        this.description = 'Stop playback and clear the queue';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            const trackCount = (player.queue?.length || 0) + (player.queue?.current ? 1 : 0);

            // Stop the player
            if (player.stop) {
                player.stop();
            } else if (player.destroy) {
                await player.destroy();
            }

            // Disconnect from voice
            await ctx.guild.members.me?.voice?.disconnect().catch(() => null);

            const has247 = await client.db?.twoFourSeven.has(ctx.guild.id);

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `${client.emoji.check} Stopped playback and cleared **${trackCount}** track${trackCount !== 1 ? 's' : ''}.` +
                                (has247
                                    ? `\n${client.emoji.info} 24/7 mode is enabled, disable it to prevent auto-rejoin.`
                                    : '')
                        ),
                ],
            });
        };
    }
}
