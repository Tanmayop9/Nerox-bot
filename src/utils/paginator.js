/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Embed pagination utility
 */

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const paginator = async (ctx, pages, startPage = 0) => {
    if (!pages.length) return;
    if (pages.length === 1) {
        return await ctx.reply({ embeds: [pages[0]] });
    }

    let currentPage = startPage;

    const getButtons = (disabled = false) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('first')
                .setEmoji('⏮')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === 0),
            new ButtonBuilder()
                .setCustomId('prev')
                .setEmoji('◀')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === 0),
            new ButtonBuilder()
                .setCustomId('page')
                .setLabel(`${currentPage + 1}/${pages.length}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('next')
                .setEmoji('▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === pages.length - 1),
            new ButtonBuilder()
                .setCustomId('last')
                .setEmoji('⏭')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === pages.length - 1),
        );
    };

    const message = await ctx.reply({
        embeds: [pages[currentPage]],
        components: [getButtons()],
    });

    const collector = message.createMessageComponentCollector({
        idle: 60000,
        filter: (i) => i.user.id === ctx.author.id,
    });

    collector.on('collect', async (interaction) => {
        switch (interaction.customId) {
            case 'first':
                currentPage = 0;
                break;
            case 'prev':
                currentPage = Math.max(0, currentPage - 1);
                break;
            case 'next':
                currentPage = Math.min(pages.length - 1, currentPage + 1);
                break;
            case 'last':
                currentPage = pages.length - 1;
                break;
        }

        await interaction.update({
            embeds: [pages[currentPage]],
            components: [getButtons()],
        });
    });

    collector.on('end', async () => {
        await message.edit({ components: [getButtons(true)] }).catch(() => null);
    });

    return message;
};
