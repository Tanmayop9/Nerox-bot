/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Clear/Purge messages command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Clear extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['purge', 'prune'];
        this.description = 'Delete multiple messages at once';
        this.userPerms = ['ManageMessages'];
        this.botPerms = ['ManageMessages'];
        this.options = [
            { opType: 'number', name: 'amount', description: 'Number of messages to delete (1-100)', required: true },
            { opType: 'user', name: 'user', description: 'Only delete messages from this user', required: false },
        ];
    }

    async execute(client, ctx, args) {
        const amount = ctx.getOption?.('amount') || parseInt(args[0]);
        const userId = ctx.getOption?.('user') || args[1]?.replace(/[<@!>]/g, '');

        if (!amount || amount < 1 || amount > 100) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a number between 1 and 100.')],
            });
        }

        try {
            let messages = await ctx.channel.messages.fetch({ limit: amount + 1 });

            // Filter by user if specified
            if (userId) {
                messages = messages.filter((m) => m.author.id === userId);
            }

            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            messages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

            // Delete messages
            const deleted = await ctx.channel.bulkDelete(messages, true);

            const reply = await ctx.reply({
                embeds: [
                    client
                        .embed('#23A55A')
                        .desc(`✅ Deleted **${deleted.size}** messages.` + (userId ? ` (from <@${userId}>)` : '')),
                ],
            });

            // Auto-delete confirmation after 5 seconds
            setTimeout(() => reply.delete().catch(() => null), 5000);
        } catch (error) {
            await ctx.reply({
                embeds: [client.embed('#F23F43').desc(`❌ Failed to delete messages: ${error.message}`)],
            });
        }
    }
}
