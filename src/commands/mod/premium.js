/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Manage bot premium users (Bot Staff)
 */

import _ from 'lodash';
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';

export default class BotPremium extends Command {
    constructor() {
        super(...arguments);
        this.name = 'botpremium';
        this.aliases = ['bp', 'staffprem'];
        this.mod = true;
        this.description = 'Manage bot premium users';
        this.usage = '<add|remove|list> [user]';
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
                name: 'user',
                opType: 'user',
                required: false,
                description: 'Target user',
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

        // List all premium users
        if (action === 'list') {
            const keys = await client.db.botstaff.keys;

            if (!keys.length) {
                return ctx.reply({
                    embeds: [client.embed().desc('No premium users found.')],
                });
            }

            const users = await Promise.all(
                keys.map(async (id) => {
                    const user = await client.users.fetch(id).catch(() => null);
                    if (!user) await client.db.botstaff.delete(id);
                    return user;
                })
            );

            const validUsers = users.filter(Boolean);
            const list = validUsers.map((u, i) => `\`${i + 1}.\` ${u.tag} (${u.id})`);
            
            const chunks = _.chunk(list, 10);
            const pages = chunks.map((chunk, i) =>
                client.embed()
                    .desc(chunk.join('\n'))
                    .footer({ text: `Page ${i + 1}/${chunks.length} • ${validUsers.length} users` })
            );

            return await paginator(ctx, pages);
        }

        // Get target user
        const target = ctx.mentions.users?.first() || 
            await client.users.fetch(args[1]).catch(() => null);

        if (!target) {
            return ctx.reply({
                embeds: [client.embed().desc('Please specify a valid user.')],
            });
        }

        const hasPremium = await client.db.botstaff.has(target.id);

        if (action === 'add') {
            if (hasPremium) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${target.tag}** already has premium.`)],
                });
            }

            await client.db.botstaff.set(target.id, true);
            await client.db.noPrefix.set(target.id, true);

            return ctx.reply({
                embeds: [client.embed().desc(`Added premium to **${target.tag}**.`)],
            });
        }

        if (action === 'remove') {
            if (!hasPremium) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${target.tag}** doesn't have premium.`)],
                });
            }

            await client.db.botstaff.delete(target.id);
            await client.db.noPrefix.delete(target.id);

            return ctx.reply({
                embeds: [client.embed().desc(`Removed premium from **${target.tag}**.`)],
            });
        }
    };
}
