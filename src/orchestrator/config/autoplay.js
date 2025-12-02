/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Toggle autoplay mode
 */

import { Command } from '../../framework/abstract/command.js';
import { updatePlayerButtons } from '../../utilities/playerUIUpdater.js';

export default class Autoplay extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['ap'];
        this.description = 'Toggle autoplay mode';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            const currentStatus = player.data?.get('autoplayStatus') ? true : false;

            if (currentStatus) {
                player.data.delete('autoplayStatus');
            } else {
                player.data.set('autoplayStatus', true);
            }

            await updatePlayerButtons(client, player).catch(() => null);

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.autoplay} Autoplay ${!currentStatus ? 'enabled' : 'disabled'}.`),
                ],
            });
        };
    }
}
