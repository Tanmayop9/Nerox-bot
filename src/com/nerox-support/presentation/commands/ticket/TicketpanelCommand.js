/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Ticket panel setup command
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class TicketPanel extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['tpanel', 'ticketsetup'];
        this.description = 'Setup a ticket creation panel';
        this.userPerms = ['ManageGuild'];
        this.options = [
            { opType: 'channel', name: 'channel', description: 'Channel to send the panel', required: false },
            { opType: 'string', name: 'title', description: 'Panel title', required: false },
            { opType: 'string', name: 'description', description: 'Panel description', required: false },
        ];
    }

    async execute(client, ctx, args) {
        const channel = ctx.getOption?.('channel')
            ? ctx.guild.channels.cache.get(ctx.getOption('channel'))
            : ctx.channel;

        const title = ctx.getOption?.('title') || args[0] || '🎫 Support Tickets';
        const description =
            ctx.getOption?.('description') ||
            args.slice(1).join(' ') ||
            'Click the button below to create a support ticket.\n\n' +
                'Our staff team will assist you as soon as possible.';

        const embed = client.embed('#3498DB').title(title).desc(description).footer({ text: 'NeroX Support System' });

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫');

        const row = new ActionRowBuilder().addComponents(button);

        await channel.send({ embeds: [embed], components: [row] });

        await ctx.reply({
            embeds: [client.embed('#23A55A').desc(`✅ Ticket panel sent to ${channel}`)],
            ephemeral: true,
        });
    }
}
