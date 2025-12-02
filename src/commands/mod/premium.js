/**
 * @fuego v1.0.0
 * @author painfuego (www.codes-for.fun)
 * @copyright 2024 1sT - Services | CC BY-NC-SA 4.0
 */
import _ from 'lodash';
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';

export default class StaffManage extends Command {
    constructor() {
        super(...arguments);
        this.mod = true; // Only Admins & Owners can use
        this.aliases = ['prem', 'pu'];
        this.description = 'Add / remove bot premium members';
        this.options = [
            {
                name: 'action',
                opType: 'string',
                description: 'Add / remove staff',
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
                description: 'User to add / remove as premium user',
            },
        ];
        
        this.execute = async (client, ctx, args) => {
            if (!['add', 'remove', 'list'].includes(args[0]?.toLowerCase())) {
                ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Please specify a valid action.`)],
                });
                return;
            }

            if (args[0].toLowerCase() === 'list') {
                const keys = await ctx.client.db.botstaff.keys;
                if (!keys.length) {
                    ctx.reply({
                        embeds: [
                            client
                                .embed()
                                .desc(`${client.emoji.cross} No premium subscribers found.`),
                        ],
                    });
                    return;
                }
                const users = await Promise.all(
                    keys.map(async (user) => await client.users.fetch(user).catch(async () => {
                        await client.db.botstaff.delete(user);
                    }))
                );
                const staffUsers = users
                    .filter((user) => user)
                    .map((user, index) => `${index + 1} **${user?.tag}** \`[${user?.id}]\``);
                const chunked = _.chunk(staffUsers, 10);
                const embeds = chunked.map(chunk => 
                    client.embed().setTitle(`${client.emoji.check} premium subscribers`).desc(chunk.join('\n'))
                );
                await paginator(ctx, embeds);
                return;
            }

            const target = ctx.mentions.users?.first()?.id ?
                ctx.mentions.users?.first()
                : await client.users.fetch(args[1]).catch(() => { });
            if (!target) {
                ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Please specify a valid user.`)],
                });
                return;
            }

            const status = await ctx.client.db.botstaff.get(target.id);
            switch (args[0].toLowerCase()) {
                case 'add':
                    if (status) {
                        ctx.reply({
                            embeds: [client.embed().desc(`${client.emoji.cross} User is already a premium member.`)],
                        });
                        return;
                    }
                    await ctx.client.db.botstaff.set(target.id, true);
                    await ctx.client.db.noPrefix.set(target.id, true);
                    await ctx.reply({
                        embeds: [
                            client.embed().desc(`${client.emoji.check} Successfully added \`${target.tag}\` to premium subscribers list.`),
                        ],
                    });
                    break;
                case 'remove':
                    if (!status) {
                        ctx.reply({
                            embeds: [client.embed().desc(`${client.emoji.cross} User is not a premium subscriber.`)],
                        });
                        return;
                    }
                    await ctx.client.db.botstaff.delete(target.id);
                    await ctx.client.db.noPrefix.delete(target.id);
                    await ctx.reply({
                        embeds: [
                            client.embed().desc(`${client.emoji.check} Successfully removed \`${target.tag}\` from premium list.`),
                        ],
                    });
                    break;
            }
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */