/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Pause playback
 */

import { Command } from '../../framework/abstract/command.js';
import { updatePlayerButtons } from '../../utilities/playerUIUpdater.js';

export default class Pause extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.description = 'Pause the current track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            if (player.paused) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.info} Player is already paused.`)],
                });
            }

            // Pause (works with both Lavalink and NeroxPlayer)
            if (player.pause) {
                player.pause(true);
            }

            await updatePlayerButtons(client, player).catch(() => null);

            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.pause} Paused playback.`)],
            });
        };
    }
}
