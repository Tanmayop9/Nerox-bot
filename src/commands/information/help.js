/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Interactive help command with minimalist design
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { filter } from '../../utils/filter.js';
import { Command } from '../../classes/abstract/command.js';

export default class Help extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['h', 'commands'];
        this.description = 'Display the command dashboard';
    }

    async execute(client, ctx) {
        // Build command categories
        const allCommands = client.commands.reduce((acc, cmd) => {
            if (['owner', 'mod', 'debug'].includes(cmd.category)) return acc;
            acc[cmd.category] ||= [];
            acc[cmd.category].push({
                name: cmd.name,
                description:
                    cmd.description?.length > 30
                        ? cmd.description.substring(0, 27) + '...'
                        : cmd.description || 'No description',
            });
            return acc;
        }, {});

        const categories = client.categories
            .filter((cat) => !['owner', 'mod', 'debug'].includes(cat))
            .sort((a, b) => a.length - b.length);

        const totalCommands = Object.values(allCommands).flat().length;

        // Main embed
        const embed = client
            .embed()
            .desc(
                `Nerox has **${totalCommands}** commands across **${categories.length}** categories. ` +
                    `Use \`${client.prefix}<command>\` to run a command or \`${client.prefix}<command> -guide\` for detailed usage.\n\n` +
                    `**Categories:** ${categories.map((c) => `\`${c}\``).join(' · ')}`
            )
            .footer({ text: `Prefix: ${client.prefix} • Select a category below` });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Select a category')
            .addOptions([
                { label: 'Home', value: 'home', description: 'Main help page' },
                ...categories.map((cat) => ({
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    value: cat,
                    description: `${allCommands[cat]?.length || 0} commands`,
                })),
                {
                    label: 'All Commands',
                    value: 'all',
                    description: 'View all commands',
                },
            ]);

        const reply = await ctx.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)],
        });

        const collector = reply.createMessageComponentCollector({
            idle: 60000,
            filter: (i) => filter(i, ctx),
        });

        collector.on('collect', async (interaction) => {
            await interaction.deferUpdate();
            const selected = interaction.values[0];

            if (selected === 'home') {
                await reply.edit({ embeds: [embed] });
            } else if (selected === 'all') {
                const allList = Object.entries(allCommands)
                    .sort((a, b) => a[0].length - b[0].length)
                    .map(
                        ([cat, cmds]) =>
                            `**${cat.charAt(0).toUpperCase() + cat.slice(1)}**\n${cmds.map((c) => `\`${c.name}\``).join(' ')}`
                    )
                    .join('\n\n');

                await reply.edit({
                    embeds: [
                        client
                            .embed()
                            .desc(allList)
                            .footer({ text: `${totalCommands} commands total` }),
                    ],
                });
            } else {
                const cmds = allCommands[selected] || [];
                const cmdList = cmds.map((c) => `\`${c.name}\` — ${c.description}`).join('\n');

                await reply.edit({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `**${selected.charAt(0).toUpperCase() + selected.slice(1)}** has **${cmds.length}** commands.\n\n${cmdList}`
                            )
                            .footer({ text: `${client.prefix}<command> -guide for usage` }),
                    ],
                });
            }
        });

        collector.on('end', async () => {
            await reply.edit({ components: [] }).catch(() => null);
        });
    }
}
