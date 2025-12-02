/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Kick command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Kick extends Command {
    constructor() {
        super(...arguments);
        this.description = 'Kick a user from the server';
        this.userPerms = ['KickMembers'];
        this.botPerms = ['KickMembers'];
        this.options = [
            { opType: 'user', name: 'user', description: 'User to kick', required: true },
            { opType: 'string', name: 'reason', description: 'Reason for kick', required: false },
        ];
    }

    async execute(client, ctx, args) {
        const userId = ctx.getOption?.('user') || args[0]?.replace(/[<@!>]/g, '');
        const reason = ctx.getOption?.('reason') || args.slice(1).join(' ') || 'No reason provided';

        if (!userId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please mention a user or provide their ID.')],
            });
        }

        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found in this server.')],
            });
        }

        // Check if trying to kick self
        if (member.id === ctx.author.id) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ You cannot kick yourself.')],
            });
        }

        // Check role hierarchy
        if (member.roles.highest.position >= ctx.member.roles.highest.position) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ You cannot kick someone with equal or higher role.')],
            });
        }

        if (!member.kickable) {
            return ctx.reply({
                embeds: [
                    client.embed('#F23F43').desc('❌ I cannot kick this user. They may have a higher role than me.'),
                ],
            });
        }

        try {
            await member.kick(`${ctx.author.tag}: ${reason}`);

            // Log to database
            const existingLogs = (await client.db.modLogs.get(ctx.guild.id)) || [];
            existingLogs.push({
                type: 'kick',
                userId: member.id,
                moderatorId: ctx.author.id,
                reason,
                timestamp: Date.now(),
            });
            await client.db.modLogs.set(ctx.guild.id, existingLogs);

            await ctx.reply({
                embeds: [
                    client
                        .embed('#F0B232')
                        .title('👢 User Kicked')
                        .desc(
                            `**User:** ${member.user.tag} (${member.id})\n**Reason:** ${reason}\n**Moderator:** ${ctx.author.tag}`
                        ),
                ],
            });
        } catch (error) {
            await ctx.reply({
                embeds: [client.embed('#F23F43').desc(`❌ Failed to kick: ${error.message}`)],
            });
        }
    }
}
