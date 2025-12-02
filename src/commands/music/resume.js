/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Resume paused playback
 */

import { Command } from '../../classes/abstract/command.js';
import { updatePlayerButtons } from '../../functions/updatePlayerButtons.js';

export default class Resume extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['unpause'];
        this.description = 'Resume paused playback';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            if (!player.paused) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.info} Player is not paused.`)],
                });
            }

            // Resume (works with both Lavalink and NeroxPlayer)
            if (player.pause) {
                player.pause(false);
            }

            await updatePlayerButtons(client, player).catch(() => null);

            const track = player.queue?.current;
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.resume} Resumed **${track?.title?.substring(0, 50) || 'playback'}**`),
                ],
            });
        };
    }
}
