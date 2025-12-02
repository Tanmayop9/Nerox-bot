/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Close ticket command
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class CloseTicket extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['tclose'];
        this.description = 'Close the current ticket';
    }

    async execute(client, ctx) {
        const ticket = await client.db.tickets.get(ctx.channel.id);

        if (!ticket) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ This is not a ticket channel.')],
            });
        }

        const confirmButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('delete_ticket')
                .setLabel('Confirm Close')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
            new ButtonBuilder().setCustomId('cancel_close').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        await ctx.reply({
            embeds: [
                client
                    .embed('#F0B232')
                    .title('⚠️ Close Ticket?')
                    .desc('Are you sure you want to close this ticket? This action will delete the channel.'),
            ],
            components: [confirmButtons],
        });
    }
}
