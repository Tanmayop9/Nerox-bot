/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Stop playback and disconnect
 */

import { Command } from '../../classes/abstract/command.js';

export default class Stop extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['dc', 'disconnect'];
        this.description = 'Stop playback and disconnect';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const trackCount = (player?.queue?.length || 0) + 1;
            
            await ctx.guild.members.me.voice.disconnect();

            const has247 = await client.db?.twoFourSeven.has(ctx.guild.id);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Stopped playback and cleared **${trackCount}** track${trackCount > 1 ? 's' : ''} from the queue.` +
                        (has247 ? ' 24/7 mode is enabled, disable it to prevent auto-rejoin.' : '')
                    )
                ],
            });
        };
    }
}
