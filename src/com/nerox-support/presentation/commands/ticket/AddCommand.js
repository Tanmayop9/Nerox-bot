/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Add user to ticket command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class AddUser extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['tadd'];
        this.description = 'Add a user to the current ticket';
        this.options = [{ opType: 'user', name: 'user', description: 'User to add', required: true }];
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

        const user = await ctx.guild.members.fetch(userId).catch(() => null);
        if (!user) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ User not found.')],
            });
        }

        await ctx.channel.permissionOverwrites.edit(user.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
            EmbedLinks: true,
        });

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Added ${user} to this ticket.`)],
        });
    }
}
