/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description View warnings command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Warnings extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['warns', 'infractions'];
        this.description = 'View warnings for a user';
        this.options = [{ opType: 'user', name: 'user', description: 'User to check warnings', required: false }];
    }

    async execute(client, ctx, args) {
        const userId = ctx.getOption?.('user') || args[0]?.replace(/[<@!>]/g, '') || ctx.author.id;

        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found.')],
            });
        }

        const warnings = (await client.db.warns.get(`${ctx.guild.id}-${userId}`)) || [];

        if (warnings.length === 0) {
            return ctx.reply({
                embeds: [client.embed('#23A55A').desc(`✅ ${user.tag} has no warnings.`)],
            });
        }

        const warnList = warnings
            .slice(-10) // Show last 10 warnings
            .map((w) => {
                const date = new Date(w.timestamp).toLocaleDateString();
                return `**#${w.id}** - ${date}\n└ ${w.reason}`;
            })
            .join('\n\n');

        await ctx.reply({
            embeds: [
                client
                    .embed('#F0B232')
                    .title(`⚠️ Warnings for ${user.tag}`)
                    .desc(`**Total Warnings:** ${warnings.length}\n\n${warnList}`)
                    .footer({ text: 'Showing last 10 warnings' }),
            ],
        });
    }
}
