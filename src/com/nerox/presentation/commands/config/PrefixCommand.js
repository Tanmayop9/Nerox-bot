import { Command } from '../../../core/client/abstracts/CommandBase.js';
export default class Prefix extends Command {
    constructor() {
        super(...arguments);
        this.description = 'Set, view or reset the server prefix';
        this.userPerms = ['ManageGuild'];
        this.execute = async (client, ctx, args) => {
            const currentPrefix = (await client.db.prefix.get(ctx.guild.id)) || client.config.prefix;
            const input = args[0];

            if (!input) {
                await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(`${client.emoji.info} Current prefix for this server is \`${currentPrefix}\``),
                    ],
                });
                return;
            }

            if (input.toLowerCase() === 'reset') {
                await client.db.prefix.delete(ctx.guild.id);
                await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `${client.emoji.check} Prefix has been reset to default: \`${client.config.prefix}\``
                            ),
                    ],
                });
                return;
            }

            if (input.length < 1 || input.length > 2) {
                await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(`${client.emoji.cross} Please provide a valid prefix with \`1-2 characters\` only.`),
                    ],
                });
                return;
            }

            await client.db.prefix.set(ctx.guild.id, input);
            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Prefix updated to \`${input}\``)],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
