/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Ticket settings command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class TicketSettings extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['tconfig', 'ticketconfig'];
        this.description = 'Configure ticket system settings';
        this.userPerms = ['ManageGuild'];
        this.options = [
            {
                opType: 'subcommand',
                name: 'category',
                description: 'Set ticket category',
                options: [{ opType: 'channel', name: 'category', description: 'Category for tickets', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'staff',
                description: 'Set staff role',
                options: [{ opType: 'role', name: 'role', description: 'Staff role for tickets', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'logs',
                description: 'Set log channel',
                options: [
                    { opType: 'channel', name: 'channel', description: 'Channel for ticket logs', required: true },
                ],
            },
            {
                opType: 'subcommand',
                name: 'view',
                description: 'View current settings',
            },
        ];
    }

    async execute(client, ctx, args) {
        const subcommand = ctx.getSubcommand?.() || args[0]?.toLowerCase();

        if (subcommand === 'category') {
            return this.setCategory(client, ctx, args);
        } else if (subcommand === 'staff') {
            return this.setStaff(client, ctx, args);
        } else if (subcommand === 'logs') {
            return this.setLogs(client, ctx, args);
        } else if (subcommand === 'view' || !subcommand) {
            return this.viewSettings(client, ctx);
        }
    }

    async setCategory(client, ctx, args) {
        const categoryId = ctx.getOption?.('category') || args[1];
        if (!categoryId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a category ID.')],
            });
        }

        const settings = (await client.db.ticketSettings.get(ctx.guild.id)) || {};
        settings.categoryId = categoryId;
        await client.db.ticketSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Ticket category set to <#${categoryId}>`)],
        });
    }

    async setStaff(client, ctx, args) {
        const roleId = ctx.getOption?.('role') || args[1];
        if (!roleId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a role.')],
            });
        }

        const settings = (await client.db.ticketSettings.get(ctx.guild.id)) || {};
        settings.staffRoleId = roleId;
        await client.db.ticketSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Ticket staff role set to <@&${roleId}>`)],
        });
    }

    async setLogs(client, ctx, args) {
        const channelId = ctx.getOption?.('channel') || args[1];
        if (!channelId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a channel.')],
            });
        }

        const settings = (await client.db.ticketSettings.get(ctx.guild.id)) || {};
        settings.logChannelId = channelId;
        await client.db.ticketSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Ticket log channel set to <#${channelId}>`)],
        });
    }

    async viewSettings(client, ctx) {
        const settings = await client.db.ticketSettings.get(ctx.guild.id);

        if (!settings) {
            return ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            '📋 **Ticket Settings**\n\n' +
                                'No settings configured yet.\n\n' +
                                '**Commands:**\n' +
                                '`!ticketsettings category <category>`\n' +
                                '`!ticketsettings staff <role>`\n' +
                                '`!ticketsettings logs <channel>`'
                        ),
                ],
            });
        }

        await ctx.reply({
            embeds: [
                client
                    .embed('#3498DB')
                    .title('📋 Ticket Settings')
                    .desc(
                        `**Category:** ${settings.categoryId ? `<#${settings.categoryId}>` : 'Not set'}\n` +
                            `**Staff Role:** ${settings.staffRoleId ? `<@&${settings.staffRoleId}>` : 'Not set'}\n` +
                            `**Log Channel:** ${settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not set'}`
                    ),
            ],
        });
    }
}
