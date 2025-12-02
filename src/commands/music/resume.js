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

            if (!player.paused) {
                return await ctx.reply({
                    embeds: [client.embed().desc('Player is not paused.')],
                });
            }

            player.pause(false);
            await updatePlayerButtons(client, player);

            const track = player.queue.current;
            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Resumed playing **${track?.title?.substring(0, 50) || 'current track'}**.`
                    )
                ],
            });
        };
    }
}
