import { Command } from '../../classes/abstract/command.js';
export default class Autoplay extends Command {
    constructor() {
        super(...arguments);
        this.player = true;
        this.inSameVC = true;
        this.description = 'Toggle 247 mode';
        this.example = ['247'];
        this.execute = async (client, ctx) => {
            const currentStatus = await client.db.twoFourSeven.get(ctx.guild.id);
            if (currentStatus) {
                await client.db.twoFourSeven.delete(ctx.guild.id);
                await ctx.reply({
                    embeds: [
                        client.embed().desc(`${client.emoji.check} Deleted 247 data and set 247 mode to \`disabled\`.`),
                    ],
                });
                return;
            }
            const player = client.getPlayer(ctx);
            await client.db.twoFourSeven.set(ctx.guild.id, {
                textId: player.textId,
                voiceId: player.voiceId,
            });
            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `${client.emoji.check} 247 is now \`enabled\`.\n\n` +
                                `${client.emoji.info} Configured as text channel : <#${player.textId}> and ` +
                                `${client.emoji.info1} voice channel : <#${player.voiceId}>.`
                        ),
                ],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
