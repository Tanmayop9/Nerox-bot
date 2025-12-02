/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Timeout/Mute command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Timeout extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['mute', 'to'];
        this.description = 'Timeout a user';
        this.userPerms = ['ModerateMembers'];
        this.botPerms = ['ModerateMembers'];
        this.options = [
            { opType: 'user', name: 'user', description: 'User to timeout', required: true },
            { opType: 'string', name: 'duration', description: 'Duration (e.g., 1h, 1d)', required: true },
            { opType: 'string', name: 'reason', description: 'Reason for timeout', required: false },
        ];
    }

    async execute(client, ctx, args) {
        const userId = ctx.getOption?.('user') || args[0]?.replace(/[<@!>]/g, '');
        const duration = ctx.getOption?.('duration') || args[1];
        const reason = ctx.getOption?.('reason') || args.slice(2).join(' ') || 'No reason provided';

        if (!userId || !duration) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Usage: `!timeout <user> <duration> [reason]`')],
            });
        }

        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found in this server.')],
            });
        }

        // Check if trying to timeout self
        if (member.id === ctx.author.id) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ You cannot timeout yourself.')],
            });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= ctx.member.roles.highest.position) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ You cannot timeout someone with equal or higher role.')],
            });
        }

        if (!member.moderatable) {
            return ctx.reply({
                embeds: [
                    client.embed('#F23F43').desc('❌ I cannot timeout this user. They may have a higher role than me.'),
                ],
            });
        }

        // Parse duration
        const durationMs = client.parseDuration(duration);
        if (!durationMs) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Invalid duration. Examples: `1m`, `1h`, `1d`')],
            });
        }

        // Max timeout is 28 days
        const maxTimeout = 28 * 24 * 60 * 60 * 1000;
        if (durationMs > maxTimeout) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Maximum timeout duration is 28 days.')],
            });
        }

        try {
            await member.timeout(durationMs, `${ctx.author.tag}: ${reason}`);

            // Log to database
            const existingLogs = (await client.db.modLogs.get(ctx.guild.id)) || [];
            existingLogs.push({
                type: 'timeout',
                userId: member.id,
                moderatorId: ctx.author.id,
                duration: durationMs,
                reason,
                timestamp: Date.now(),
            });
            await client.db.modLogs.set(ctx.guild.id, existingLogs);

            await ctx.reply({
                embeds: [
                    client
                        .embed('#F0B232')
                        .title('⏰ User Timed Out')
                        .desc(
                            `**User:** ${member.user.tag} (${member.id})\n` +
                                `**Duration:** ${client.formatDuration(durationMs)}\n` +
                                `**Reason:** ${reason}\n` +
                                `**Moderator:** ${ctx.author.tag}`
                        ),
                ],
            });
        } catch (error) {
            await ctx.reply({
                embeds: [client.embed('#F23F43').desc(`❌ Failed to timeout: ${error.message}`)],
            });
        }
    }
}
