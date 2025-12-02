/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Manage server premium status
 */

import _ from 'lodash';
import { paginator } from '../../toolkit/pageNavigator.js';
import { Command } from '../../framework/abstract/command.js';

export default class ServerPremium extends Command {
    constructor() {
        super(...arguments);
        this.name = 'serverpremium';
        this.aliases = ['sp', 'guildpremium'];
        this.mod = true;
        this.description = 'Manage server premium';
        this.usage = '<add|remove|list> [server_id]';
        this.options = [
            {
                name: 'action',
                opType: 'string',
                description: 'Action to perform',
                required: true,
                choices: [
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' },
                    { name: 'list', value: 'list' },
                ],
            },
            {
                name: 'server',
                opType: 'string',
                required: false,
                description: 'Server ID',
            },
        ];
    }

    execute = async (client, ctx, args) => {
        const action = args[0]?.toLowerCase();

        if (!['add', 'remove', 'list'].includes(action)) {
            return ctx.reply({
                embeds: [client.embed().desc('Please specify: `add`, `remove`, or `list`.')],
            });
        }

        // List all premium servers
        if (action === 'list') {
            const keys = await client.db.serverstaff.keys;

            if (!keys.length) {
                return ctx.reply({
                    embeds: [client.embed().desc('No premium servers found.')],
                });
            }

            const servers = keys.map((id) => {
                const guild = client.guilds.cache.get(id);
                return guild ? `\`${guild.name}\` (${id})` : `Unknown (${id})`;
            });

            const chunks = _.chunk(servers, 10);
            const pages = chunks.map((chunk, i) =>
                client
                    .embed()
                    .desc(chunk.join('\n'))
                    .footer({
                        text: `Page ${i + 1}/${chunks.length} • ${keys.length} servers`,
                    })
            );

            return await paginator(ctx, pages);
        }

        // Get target server
        const serverId = args[1] || ctx.guild?.id;

        if (!serverId) {
            return ctx.reply({
                embeds: [client.embed().desc('Please specify a server ID.')],
            });
        }

        const guild = client.guilds.cache.get(serverId);
        const guildName = guild?.name || 'Unknown Server';
        const hasPremium = await client.db.serverstaff.has(serverId);

        if (action === 'add') {
            if (hasPremium) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${guildName}** already has premium.`)],
                });
            }

            await client.db.serverstaff.set(serverId, true);

            return ctx.reply({
                embeds: [client.embed().desc(`Added premium to **${guildName}**.`)],
            });
        }

        if (action === 'remove') {
            if (!hasPremium) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${guildName}** doesn't have premium.`)],
                });
            }

            await client.db.serverstaff.delete(serverId);

            return ctx.reply({
                embeds: [client.embed().desc(`Removed premium from **${guildName}**.`)],
            });
        }
    };
}
