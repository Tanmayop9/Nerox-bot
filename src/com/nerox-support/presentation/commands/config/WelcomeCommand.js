/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Welcome/Leave message settings command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Welcome extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['greet', 'welcomer'];
        this.description = 'Configure welcome and leave messages';
        this.userPerms = ['ManageGuild'];
        this.options = [
            {
                opType: 'subcommand',
                name: 'channel',
                description: 'Set welcome channel',
                options: [{ opType: 'channel', name: 'channel', description: 'Welcome channel', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'message',
                description: 'Set welcome message',
                options: [
                    {
                        opType: 'string',
                        name: 'message',
                        description: 'Welcome message (use {user}, {server}, {count})',
                        required: true,
                    },
                ],
            },
            {
                opType: 'subcommand',
                name: 'leave',
                description: 'Configure leave messages',
                options: [{ opType: 'channel', name: 'channel', description: 'Leave channel', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'leavemessage',
                description: 'Set leave message',
                options: [{ opType: 'string', name: 'message', description: 'Leave message', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'toggle',
                description: 'Enable/disable welcome messages',
            },
            {
                opType: 'subcommand',
                name: 'test',
                description: 'Test welcome message',
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

        if (subcommand === 'channel') {
            return this.setChannel(client, ctx, args);
        } else if (subcommand === 'message') {
            return this.setMessage(client, ctx, args);
        } else if (subcommand === 'leave') {
            return this.setLeaveChannel(client, ctx, args);
        } else if (subcommand === 'leavemessage') {
            return this.setLeaveMessage(client, ctx, args);
        } else if (subcommand === 'toggle') {
            return this.toggle(client, ctx);
        } else if (subcommand === 'test') {
            return this.test(client, ctx);
        } else if (subcommand === 'view' || !subcommand) {
            return this.viewSettings(client, ctx);
        }
    }

    async setChannel(client, ctx, args) {
        const channelId = ctx.getOption?.('channel') || args[1];
        if (!channelId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a channel.')],
            });
        }

        const settings = (await client.db.welcomeSettings.get(ctx.guild.id)) || {};
        settings.channelId = channelId;
        settings.enabled = true;
        await client.db.welcomeSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Welcome channel set to <#${channelId}>`)],
        });
    }

    async setMessage(client, ctx, args) {
        const message = ctx.getOption?.('message') || args.slice(1).join(' ');
        if (!message) {
            return ctx.reply({
                embeds: [
                    client
                        .embed('#F23F43')
                        .desc(
                            '❌ Please provide a message.\n\n' +
                                '**Placeholders:**\n' +
                                '`{user}` - Mention the user\n' +
                                '`{username}` - Username\n' +
                                '`{tag}` - User tag\n' +
                                '`{server}` - Server name\n' +
                                '`{count}` - Member count'
                        ),
                ],
            });
        }

        const settings = (await client.db.welcomeSettings.get(ctx.guild.id)) || {};
        settings.message = message;
        await client.db.welcomeSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Welcome message updated!\n\n**Preview:**\n${message}`)],
        });
    }

    async setLeaveChannel(client, ctx, args) {
        const channelId = ctx.getOption?.('channel') || args[1];
        if (!channelId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a channel.')],
            });
        }

        const settings = (await client.db.welcomeSettings.get(ctx.guild.id)) || {};
        settings.leaveChannelId = channelId;
        settings.leaveEnabled = true;
        await client.db.welcomeSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Leave channel set to <#${channelId}>`)],
        });
    }

    async setLeaveMessage(client, ctx, args) {
        const message = ctx.getOption?.('message') || args.slice(1).join(' ');
        if (!message) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a leave message.')],
            });
        }

        const settings = (await client.db.welcomeSettings.get(ctx.guild.id)) || {};
        settings.leaveMessage = message;
        await client.db.welcomeSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Leave message updated!\n\n**Preview:**\n${message}`)],
        });
    }

    async toggle(client, ctx) {
        const settings = (await client.db.welcomeSettings.get(ctx.guild.id)) || {};
        settings.enabled = !settings.enabled;
        await client.db.welcomeSettings.set(ctx.guild.id, settings);

        await ctx.reply({
            embeds: [
                client
                    .embed(settings.enabled ? '#23A55A' : '#F23F43')
                    .desc(
                        `${settings.enabled ? '✅' : '❌'} Welcome messages ${settings.enabled ? 'enabled' : 'disabled'}.`
                    ),
            ],
        });
    }

    async test(client, ctx) {
        // Emit fake member add event
        client.emit('guildMemberAdd', ctx.member);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc('✅ Test welcome message sent!')],
            ephemeral: true,
        });
    }

    async viewSettings(client, ctx) {
        const settings = await client.db.welcomeSettings.get(ctx.guild.id);

        if (!settings) {
            return ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            '📋 **Welcome Settings**\n\n' +
                                'No settings configured yet.\n\n' +
                                '**Commands:**\n' +
                                '`!welcome channel <channel>`\n' +
                                '`!welcome message <message>`\n' +
                                '`!welcome leave <channel>`\n' +
                                '`!welcome leavemessage <message>`\n' +
                                '`!welcome toggle`\n' +
                                '`!welcome test`'
                        ),
                ],
            });
        }

        await ctx.reply({
            embeds: [
                client
                    .embed('#3498DB')
                    .title('📋 Welcome Settings')
                    .desc(
                        `**Enabled:** ${settings.enabled ? '✅' : '❌'}\n` +
                            `**Channel:** ${settings.channelId ? `<#${settings.channelId}>` : 'Not set'}\n` +
                            `**Message:** ${settings.message || 'Default'}\n\n` +
                            `**Leave Enabled:** ${settings.leaveEnabled ? '✅' : '❌'}\n` +
                            `**Leave Channel:** ${settings.leaveChannelId ? `<#${settings.leaveChannelId}>` : 'Not set'}\n` +
                            `**Leave Message:** ${settings.leaveMessage || 'Default'}`
                    ),
            ],
        });
    }
}
