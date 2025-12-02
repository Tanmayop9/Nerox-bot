/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Remove user from ticket command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class RemoveUser extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['tremove'];
        this.description = 'Remove a user from the current ticket';
        this.options = [{ opType: 'user', name: 'user', description: 'User to remove', required: true }];
    }

    async execute(client, ctx, args) {
        const ticket = await client.db.tickets.get(ctx.channel.id);

        if (!ticket) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ This is not a ticket channel.')],
            });
        }

        const userId = ctx.getOption?.('user') || args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please mention a user or provide their ID.')],
            });
        }

        // Don't allow removing the ticket creator
        if (userId === ticket.userId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Cannot remove the ticket creator.')],
            });
        }

        const user = await ctx.guild.members.fetch(userId).catch(() => null);
        if (!user) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found.')],
            });
        }

        await ctx.channel.permissionOverwrites.delete(user.id);

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Removed ${user} from this ticket.`)],
        });
    }
}
