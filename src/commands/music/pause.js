/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Pause playback
 */

import { Command } from '../../classes/abstract/command.js';
import { updatePlayerButtons } from '../../functions/updatePlayerButtons.js';

export default class Pause extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.description = 'Pause the current track';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player.playing) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Player is not playing`')],
                });
            }

            player.pause(true);
            await updatePlayerButtons(client, player);

            await ctx.reply({
                embeds: [client.embed().desc('`Paused`')],
            });
        };
    }
}
