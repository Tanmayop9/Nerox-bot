/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Warn command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Warn extends Command {
    constructor() {
        super(...arguments);
        this.description = 'Warn a user';
        this.userPerms = ['ModerateMembers'];
        this.options = [
            { opType: 'user', name: 'user', description: 'User to warn', required: true },
            { opType: 'string', name: 'reason', description: 'Reason for warning', required: true },
        ];
    }

    async execute(client, ctx, args) {
        const userId = ctx.getOption?.('user') || args[0]?.replace(/[<@!>]/g, '');
        const reason = ctx.getOption?.('reason') || args.slice(1).join(' ');

        if (!userId || !reason) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Usage: `!warn <user> <reason>`')],
            });
        }

        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found in this server.')],
            });
        }

        // Get current warnings
        const userWarns = (await client.db.warns.get(`${ctx.guild.id}-${member.id}`)) || [];

        const warning = {
            id: userWarns.length + 1,
            moderatorId: ctx.author.id,
            reason,
            timestamp: Date.now(),
        };

        userWarns.push(warning);
        await client.db.warns.set(`${ctx.guild.id}-${member.id}`, userWarns);

        // Log to database
        const existingLogs = (await client.db.modLogs.get(ctx.guild.id)) || [];
        existingLogs.push({
            type: 'warn',
            userId: member.id,
            moderatorId: ctx.author.id,
            reason,
            timestamp: Date.now(),
        });
        await client.db.modLogs.set(ctx.guild.id, existingLogs);

        // Try to DM the user
        await member
            .send({
                embeds: [
                    client
                        .embed('#F0B232')
                        .title(`⚠️ Warning in ${ctx.guild.name}`)
                        .desc(
                            `**Reason:** ${reason}\n**Moderator:** ${ctx.author.tag}\n\n*This is warning #${userWarns.length}*`
                        ),
                ],
            })
            .catch(() => null);

        await ctx.reply({
            embeds: [
                client
                    .embed('#F0B232')
                    .title('⚠️ User Warned')
                    .desc(
                        `**User:** ${member.user.tag} (${member.id})\n` +
                            `**Reason:** ${reason}\n` +
                            `**Warning #:** ${userWarns.length}\n` +
                            `**Moderator:** ${ctx.author.tag}`
                    ),
            ],
        });
    }
}
