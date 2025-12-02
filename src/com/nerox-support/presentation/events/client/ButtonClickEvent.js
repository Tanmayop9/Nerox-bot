/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Button click event handler for tickets, giveaways, etc.
 */

import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default class ButtonClick {
    constructor() {
        this.name = 'buttonClick';
    }

    execute = async (client, interaction) => {
        const customId = interaction.customId;

        // Ticket creation
        if (customId === 'create_ticket') {
            await this.handleCreateTicket(client, interaction);
        }

        // Ticket close
        if (customId === 'close_ticket') {
            await this.handleCloseTicket(client, interaction);
        }

        // Ticket delete (confirm close)
        if (customId === 'delete_ticket') {
            await this.handleDeleteTicket(client, interaction);
        }

        // Cancel ticket close
        if (customId === 'cancel_close') {
            await interaction.update({
                content: 'Ticket close cancelled.',
                embeds: [],
                components: [],
            });
        }

        // Giveaway entry
        if (customId.startsWith('giveaway_enter_')) {
            await this.handleGiveawayEntry(client, interaction);
        }
    };

    async handleCreateTicket(client, interaction) {
        await interaction.deferReply({ ephemeral: true });

        const settings = await client.db.ticketSettings.get(interaction.guild.id);
        if (!settings) {
            return interaction.editReply({
                embeds: [client.embed('#F23F43').desc('❌ Ticket system is not configured.')],
            });
        }

        // Check if user already has an open ticket
        const existingTickets = await client.db.tickets.entries;
        const userTicket = existingTickets.find(
            ([, ticket]) =>
                ticket.guildId === interaction.guild.id &&
                ticket.userId === interaction.user.id &&
                ticket.status === 'open'
        );

        if (userTicket) {
            return interaction.editReply({
                embeds: [
                    client.embed('#F0B232').desc(`⚠️ You already have an open ticket: <#${userTicket[1].channelId}>`),
                ],
            });
        }

        // Get ticket count
        let ticketCount = (await client.db.ticketCount.get(interaction.guild.id)) || 0;
        ticketCount++;
        await client.db.ticketCount.set(interaction.guild.id, ticketCount);

        // Create ticket channel
        const ticketName = `ticket-${String(ticketCount).padStart(4, '0')}`;

        try {
            const channel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: settings.categoryId || null,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages,
                        ],
                    },
                    ...(settings.staffRoleId
                        ? [
                              {
                                  id: settings.staffRoleId,
                                  allow: [
                                      PermissionFlagsBits.ViewChannel,
                                      PermissionFlagsBits.SendMessages,
                                      PermissionFlagsBits.AttachFiles,
                                      PermissionFlagsBits.EmbedLinks,
                                      PermissionFlagsBits.ReadMessageHistory,
                                      PermissionFlagsBits.ManageMessages,
                                  ],
                              },
                          ]
                        : []),
                ],
            });

            // Save ticket to database
            await client.db.tickets.set(channel.id, {
                channelId: channel.id,
                guildId: interaction.guild.id,
                userId: interaction.user.id,
                ticketNumber: ticketCount,
                status: 'open',
                createdAt: Date.now(),
            });

            // Send welcome message in ticket
            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒');

            const embed = client
                .embed('#3498DB')
                .title('🎫 Ticket Created')
                .desc(
                    `Welcome ${interaction.user}!\n\n` +
                        'Please describe your issue or question and our staff will assist you shortly.\n\n' +
                        `**Ticket:** #${ticketCount}\n` +
                        `**Created:** <t:${Math.floor(Date.now() / 1000)}:R>`
                )
                .footer({ text: `Ticket ID: ${channel.id}` });

            await channel.send({
                content: settings.staffRoleId ? `<@&${settings.staffRoleId}>` : null,
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(closeButton)],
            });

            await interaction.editReply({
                embeds: [client.embed('#23A55A').desc(`✅ Your ticket has been created: ${channel}`)],
            });

            // Log ticket creation
            if (settings.logChannelId) {
                const logChannel = await interaction.guild.channels.fetch(settings.logChannelId).catch(() => null);
                if (logChannel) {
                    await logChannel.send({
                        embeds: [
                            client
                                .embed('#3498DB')
                                .title('📩 Ticket Opened')
                                .desc(
                                    `**User:** ${interaction.user.tag} (${interaction.user.id})\n` +
                                        `**Channel:** ${channel}\n` +
                                        `**Ticket #:** ${ticketCount}`
                                )
                                .setTimestamp(),
                        ],
                    });
                }
            }
        } catch (error) {
            client.log(`Error creating ticket: ${error.message}`, 'error');
            await interaction.editReply({
                embeds: [client.embed('#F23F43').desc(`❌ Failed to create ticket: ${error.message}`)],
            });
        }
    }

    async handleCloseTicket(client, interaction) {
        const ticket = await client.db.tickets.get(interaction.channel.id);
        if (!ticket) {
            return interaction.reply({
                embeds: [client.embed('#F23F43').desc('❌ This is not a ticket channel.')],
                ephemeral: true,
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

        await interaction.reply({
            embeds: [
                client
                    .embed('#F0B232')
                    .title('⚠️ Close Ticket?')
                    .desc('Are you sure you want to close this ticket? This action will delete the channel.'),
            ],
            components: [confirmButtons],
        });
    }

    async handleDeleteTicket(client, interaction) {
        const ticket = await client.db.tickets.get(interaction.channel.id);
        if (!ticket) {
            return interaction.update({
                embeds: [client.embed('#F23F43').desc('❌ This is not a ticket channel.')],
                components: [],
            });
        }

        const settings = await client.db.ticketSettings.get(interaction.guild.id);

        // Update ticket status
        await client.db.tickets.set(interaction.channel.id, {
            ...ticket,
            status: 'closed',
            closedAt: Date.now(),
            closedBy: interaction.user.id,
        });

        await interaction.update({
            embeds: [client.embed('#23A55A').desc('✅ Ticket will be closed in 5 seconds...')],
            components: [],
        });

        // Log ticket close
        if (settings?.logChannelId) {
            const logChannel = await interaction.guild.channels.fetch(settings.logChannelId).catch(() => null);
            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        client
                            .embed('#F23F43')
                            .title('🔒 Ticket Closed')
                            .desc(
                                `**Ticket #:** ${ticket.ticketNumber}\n` +
                                    `**Opened by:** <@${ticket.userId}>\n` +
                                    `**Closed by:** ${interaction.user.tag}\n` +
                                    `**Duration:** ${client.formatDuration(Date.now() - ticket.createdAt)}`
                            )
                            .setTimestamp(),
                    ],
                });
            }
        }

        // Delete channel after delay
        setTimeout(async () => {
            await interaction.channel.delete().catch(() => null);
        }, 5000);
    }

    async handleGiveawayEntry(client, interaction) {
        // This is handled by reaction-based giveaways, but kept for potential button-based entries
        await interaction.reply({
            content: '🎉 You have entered the giveaway! Good luck!',
            ephemeral: true,
        });
    }
}
