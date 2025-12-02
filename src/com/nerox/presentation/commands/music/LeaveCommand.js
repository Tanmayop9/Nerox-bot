/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Leave command - Disconnect bot from voice channel
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Leave extends Command {
    constructor() {
        super(...arguments);
        this.player = true;
        this.inSameVC = true;
        this.aliases = ['dc', 'disconnect'];
        this.description = 'Disconnect the bot from voice channel';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            // Destroy player if exists
            if (player) {
                await player.destroy().catch(() => null);
            }

            // Disconnect from voice
            await ctx.guild.members.me?.voice?.disconnect().catch(() => null);

            const has247 = await client.db?.twoFourSeven.has(ctx.guild.id);

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `${client.emoji.check} Destroyed and disconnected the player.` +
                                (has247
                                    ? `\n${client.emoji.info} Disable 24/7 to prevent the bot from joining back.`
                                    : '')
                        ),
                ],
            });
        };
    }
}
