/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Ban command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Ban extends Command {
    constructor() {
        super(...arguments);
        this.description = 'Ban a user from the server';
        this.userPerms = ['BanMembers'];
        this.botPerms = ['BanMembers'];
        this.options = [
            { opType: 'user', name: 'user', description: 'User to ban', required: true },
            { opType: 'string', name: 'reason', description: 'Reason for ban', required: false },
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
        const user = member?.user || (await client.users.fetch(userId).catch(() => null));

        if (!user) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found.')],
            });
        }

        // Check if trying to ban self
        if (user.id === ctx.author.id) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ You cannot ban yourself.')],
            });
        }

        // Check role hierarchy if member is in server
        if (member) {
            if (member.roles.highest.position >= ctx.member.roles.highest.position) {
                return ctx.reply({
                    embeds: [client.embed('#F23F43').desc('❌ You cannot ban someone with equal or higher role.')],
                });
            }

            if (!member.bannable) {
                return ctx.reply({
                    embeds: [
                        client.embed('#F23F43').desc('❌ I cannot ban this user. They may have a higher role than me.'),
                    ],
                });
            }
        }

        try {
            await ctx.guild.members.ban(user.id, { reason: `${ctx.author.tag}: ${reason}` });

            // Log to database
            await client.db.modLogs.push(ctx.guild.id, {
                type: 'ban',
                userId: user.id,
                moderatorId: ctx.author.id,
                reason,
                timestamp: Date.now(),
            });

            await ctx.reply({
                embeds: [
                    client
                        .embed('#F23F43')
                        .title('🔨 User Banned')
                        .desc(
                            `**User:** ${user.tag} (${user.id})\n**Reason:** ${reason}\n**Moderator:** ${ctx.author.tag}`
                        ),
                ],
            });
        } catch (error) {
            await ctx.reply({
                embeds: [client.embed('#F23F43').desc(`❌ Failed to ban: ${error.message}`)],
            });
        }
    }
}
