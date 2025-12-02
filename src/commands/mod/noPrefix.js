/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Manage no-prefix users
 */

import _ from 'lodash';
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';

export default class NoPrefix extends Command {
    constructor() {
        super(...arguments);
        this.mod = true;
        this.aliases = ['nop'];
        this.description = 'Manage no-prefix privileges';
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

        // List all no-prefix users
        if (action === 'list') {
            const keys = await client.db.noPrefix.keys;

            if (!keys.length) {
                return ctx.reply({
                    embeds: [client.embed().desc('No users have no-prefix privileges.')],
                });
            }

            const users = await Promise.all(
                keys.map(async (id) => {
                    const user = await client.users.fetch(id).catch(() => null);
                    if (!user) await client.db.noPrefix.delete(id);
                    return user;
                })
            );

            const validUsers = users.filter(Boolean);
            const list = validUsers.map((u, i) => `\`${i + 1}.\` ${u.tag} (${u.id})`);

            const chunks = _.chunk(list, 10);
            const pages = chunks.map((chunk, i) =>
                client
                    .embed()
                    .desc(chunk.join('\n'))
                    .footer({
                        text: `Page ${i + 1}/${chunks.length} • ${validUsers.length} users`,
                    })
            );

            return await paginator(ctx, pages);
        }

        // Get target user
        const target = ctx.mentions.users?.first() || (await client.users.fetch(args[1]).catch(() => null));

        if (!target) {
            return ctx.reply({
                embeds: [client.embed().desc('Please specify a valid user.')],
            });
        }

        const hasNoPrefix = await client.db.noPrefix.has(target.id);

        if (action === 'add') {
            if (hasNoPrefix) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${target.tag}** already has no-prefix.`)],
                });
            }

            await client.db.noPrefix.set(target.id, true);

            return ctx.reply({
                embeds: [client.embed().desc(`Granted no-prefix to **${target.tag}**.`)],
            });
        }

        if (action === 'remove') {
            if (!hasNoPrefix) {
                return ctx.reply({
                    embeds: [client.embed().desc(`**${target.tag}** doesn't have no-prefix.`)],
                });
            }

            await client.db.noPrefix.delete(target.id);

            return ctx.reply({
                embeds: [client.embed().desc(`Revoked no-prefix from **${target.tag}**.`)],
            });
        }
    };
}
