/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Help command for support bot
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Help extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['h', 'commands'];
        this.description = 'Display the command dashboard';
    }

    async execute(client, ctx) {
        // Build command categories
        const allCommands = client.commands.reduce((acc, cmd) => {
            acc[cmd.category] ||= [];
            acc[cmd.category].push({
                name: cmd.name,
                description:
                    cmd.description?.length > 40
                        ? cmd.description.substring(0, 37) + '...'
                        : cmd.description || 'No description',
            });
            return acc;
        }, {});

        const categories = client.categories.sort((a, b) => a.length - b.length);
        const totalCommands = Object.values(allCommands).flat().length;

        const categoryEmojis = {
            ticket: '🎫',
            giveaway: '🎉',
            moderation: '🛡️',
            config: '⚙️',
        };

        // Main embed
        const embed = client
            .embed('#5865F2')
            .title('NeroX Support Bot')
            .desc(
                'A complete support server management bot with ticket system, giveaways, and moderation.\n\n' +
                    `**${totalCommands}** commands across **${categories.length}** categories.\n\n` +
                    '**Categories:**\n' +
                    categories
                        .map(
                            (c) =>
                                `${categoryEmojis[c] || '📁'} **${c.charAt(0).toUpperCase() + c.slice(1)}** - ${allCommands[c]?.length || 0} commands`
                        )
                        .join('\n')
            )
            .footer({ text: `Prefix: ${client.prefix} • Select a category below` });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Select a category')
            .addOptions([
                { label: 'Home', value: 'home', description: 'Main help page', emoji: '🏠' },
                ...categories.map((cat) => ({
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    value: cat,
                    description: `${allCommands[cat]?.length || 0} commands`,
                    emoji: categoryEmojis[cat] || '📁',
                })),
            ]);

        const reply = await ctx.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)],
        });

        const collector = reply.createMessageComponentCollector({
            idle: 60000,
            filter: (i) => i.user.id === ctx.author.id,
        });

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            const selected = interaction.values[0];

            if (selected === 'home') {
                await reply.edit({ embeds: [embed] });
            } else {
                const cmds = allCommands[selected] || [];
                const cmdList = cmds.map((c) => `\`${c.name}\` — ${c.description}`).join('\n');

                await reply.edit({
                    embeds: [
                        client
                            .embed('#5865F2')
                            .title(
                                `${categoryEmojis[selected] || '📁'} ${selected.charAt(0).toUpperCase() + selected.slice(1)}`
                            )
                            .desc(`**${cmds.length}** commands\n\n${cmdList}`)
                            .footer({ text: `${client.prefix}<command> for usage` }),
                    ],
                });
            }
        });

        collector.on('end', async () => {
            await reply.edit({ components: [] }).catch(() => null);
        });
    }
}
