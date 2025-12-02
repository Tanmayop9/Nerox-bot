/**
 * @fuego v1.0.0
 * @author painfuego
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import { Command } from '../../classes/abstract/command.js';

export default class PremiumServer extends Command {
    constructor() {
        super(...arguments);
        this.mod = true;
        this.aliases = ['ps', 'premserver'];
        this.description = 'Add / remove a server from the premium list';
        this.options = [
            {
                name: 'action',
                opType: 'string',
                description: 'Add or remove a server',
                required: true,
                choices: [
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' },
                    { name: 'list', value: 'list' },
                ],
            },
            {
                name: 'server_id',
                opType: 'string',
                required: false,
                description: 'Server ID to add/remove',
            },
        ];
        this.execute = async (client, ctx, args) => {
            if (!['add', 'remove', 'list'].includes(args[0]?.toLowerCase())) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Please specify a valid action: add, remove, or list.`)],
                });
            }

            if (args[0].toLowerCase() === 'list') {
                const keys = await client.db.serverstaff.keys;
                if (!keys.length) {
                    return ctx.reply({
                        embeds: [client.embed().desc(`${client.emoji.cross} No servers currently have premium access.`)],
                    });
                }

                const serverDetails = await Promise.all(keys.map(async (id, index) => {
                    const server = client.guilds.cache.get(id) || await client.guilds.fetch(id).catch(() => null);
                    return `${index + 1}. **${server?.name || 'Unknown Server'}** : [\`${id}\`]`;
                }));

                return ctx.reply({
                    embeds: [
                        client.embed()
                            .setTitle(`${client.emoji.check} Premium Servers List`)
                            .desc(serverDetails.join('\n')),
                    ],
                });
            }

            const serverId = args[1] || ctx.guild?.id;
            if (!serverId) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Please provide a valid server ID or use the command in a server.`)],
                });
            }

            const isPremium = await client.db.serverstaff.has(serverId);

            if (args[0].toLowerCase() === 'add') {
                if (isPremium) {
                    return ctx.reply({
                        embeds: [client.embed().desc(`${client.emoji.cross} This server already has premium access.`)],
                    });
                }
                await client.db.serverstaff.set(serverId, true);
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.check} Successfully added server \`${serverId}\` to the premium list.`)],
                });
            }

            if (args[0].toLowerCase() === 'remove') {
                if (!isPremium) {
                    return ctx.reply({
                        embeds: [client.embed().desc(`${client.emoji.cross} This server is not in the premium list.`)],
                    });
                }
                await client.db.serverstaff.delete(serverId);
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.check} Successfully removed server \`${serverId}\` from the premium list.`)],
                });
            }
        };
    }
}