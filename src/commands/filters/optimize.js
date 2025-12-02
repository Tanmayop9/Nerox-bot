/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { Command } from '../../classes/abstract/command.js';
export default class Optimize extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.serverstaff = true;
        this.description = 'Adjust for poor network';
        this.execute = async (client, ctx) => {
            const waitEmbed = await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.timer} Please wait while I adjust VC parameters appropriately ` +
                        `so that people with a slower network can still enjoy.`),
                ],
            });
            const bitrate = 8000;
            const rtcRegion = 'singapore';
            await ctx.member.voice.channel.edit({
                bitrate,
                rtcRegion,
            });
            await waitEmbed.edit({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.check} Hope this helps.\n\n` +
                        `${client.emoji.info} Set voice channel bitrate to \`${bitrate / 1000}kbps\`.\n` +
                        `${client.emoji.info} Set voice channel region to \`${rtcRegion}\`.`),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
