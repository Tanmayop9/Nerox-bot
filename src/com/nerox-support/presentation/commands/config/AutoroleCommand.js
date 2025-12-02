/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Auto-role command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Autorole extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['joinrole', 'welcomerole'];
        this.description = 'Configure auto-role for new members';
        this.userPerms = ['ManageRoles'];
        this.options = [
            {
                opType: 'subcommand',
                name: 'add',
                description: 'Add a role to auto-assign',
                options: [{ opType: 'role', name: 'role', description: 'Role to auto-assign', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'remove',
                description: 'Remove a role from auto-assign',
                options: [{ opType: 'role', name: 'role', description: 'Role to remove', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'list',
                description: 'List all auto-roles',
            },
            {
                opType: 'subcommand',
                name: 'clear',
                description: 'Remove all auto-roles',
            },
        ];
    }

    async execute(client, ctx, args) {
        const subcommand = ctx.getSubcommand?.() || args[0]?.toLowerCase();

        if (subcommand === 'add') {
            return this.addRole(client, ctx, args);
        } else if (subcommand === 'remove') {
            return this.removeRole(client, ctx, args);
        } else if (subcommand === 'clear') {
            return this.clearRoles(client, ctx);
        } else if (subcommand === 'list' || !subcommand) {
            return this.listRoles(client, ctx);
        }
    }

    async addRole(client, ctx, args) {
        const roleId = ctx.getOption?.('role') || args[1]?.replace(/[<@&>]/g, '');
        if (!roleId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a role.')],
            });
        }

        const role = ctx.guild.roles.cache.get(roleId);
        if (!role) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Role not found.')],
            });
        }

        // Check if bot can assign this role
        if (role.position >= ctx.guild.members.me.roles.highest.position) {
            return ctx.reply({
                embeds: [
                    client.embed('#F23F43').desc('❌ I cannot assign this role. It is higher than my highest role.'),
                ],
            });
        }

        const autoRoles = (await client.db.autoRoles.get(ctx.guild.id)) || [];

        if (autoRoles.includes(roleId)) {
            return ctx.reply({
                embeds: [client.embed('#F0B232').desc('⚠️ This role is already an auto-role.')],
            });
        }

        autoRoles.push(roleId);
        await client.db.autoRoles.set(ctx.guild.id, autoRoles);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Added ${role} to auto-roles.`)],
        });
    }

    async removeRole(client, ctx, args) {
        const roleId = ctx.getOption?.('role') || args[1]?.replace(/[<@&>]/g, '');
        if (!roleId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a role.')],
            });
        }

        const autoRoles = (await client.db.autoRoles.get(ctx.guild.id)) || [];
        const index = autoRoles.indexOf(roleId);

        if (index === -1) {
            return ctx.reply({
                embeds: [client.embed('#F0B232').desc('⚠️ This role is not an auto-role.')],
            });
        }

        autoRoles.splice(index, 1);
        await client.db.autoRoles.set(ctx.guild.id, autoRoles);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Removed <@&${roleId}> from auto-roles.`)],
        });
    }

    async clearRoles(client, ctx) {
        await client.db.autoRoles.set(ctx.guild.id, []);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc('✅ All auto-roles have been removed.')],
        });
    }

    async listRoles(client, ctx) {
        const autoRoles = (await client.db.autoRoles.get(ctx.guild.id)) || [];

        if (autoRoles.length === 0) {
            return ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            '📋 **Auto-Roles**\n\n' +
                                'No auto-roles configured.\n\n' +
                                '**Commands:**\n' +
                                '`!autorole add <role>`\n' +
                                '`!autorole remove <role>`\n' +
                                '`!autorole clear`'
                        ),
                ],
            });
        }

        const roleList = autoRoles.map((id) => `• <@&${id}>`).join('\n');

        await ctx.reply({
            embeds: [client.embed('#3498DB').title('📋 Auto-Roles').desc(`New members will receive:\n\n${roleList}`)],
        });
    }
}
