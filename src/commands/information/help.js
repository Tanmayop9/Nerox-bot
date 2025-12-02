import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { filter } from '../../utils/filter.js';
import { Command } from '../../classes/abstract/command.js';

export default class Help extends Command {
	constructor() {
		super(...arguments);
		this.aliases = ['h'];
		this.description = 'Displays the sleek command dashboard.';
	}

	async execute(client, ctx) {
		const allCommands = client.commands.reduce((acc, cmd) => {
			if (['owner', 'mod', 'debug'].includes(cmd.category)) return acc;
			acc[cmd.category] ||= [];
			acc[cmd.category].push({
				name: cmd.name,
				description: cmd.description?.length > 25 
					? cmd.description.substring(0, 22) + '...' 
					: cmd.description || 'No description',
			});
			return acc;
		}, {});

		const categories = client.categories
			.sort((a, b) => a.length - b.length)
			.filter(category => !['owner', 'mod', 'debug'].includes(category));

		const embed = client.embed()
			.desc(
				`${client.emoji.info} \`Prefix: ${client.prefix}\`\n` +
				`${client.emoji.info} \`Crafted by NeroX Studios with love, because our owner is lowkey obsessed with you.\`\n\n` +
				`${client.emoji.info1} Here's how to use me like a pro:\n` +
				`\`+<command> -guide\` — Shows detailed usage info\n\n` +
				`${client.emoji.info} **Argument Legend:**\n\`\`<> - Required\n[] - Optional\`\`\n\n` +
				`**Browse command categories using the dropdown below.**`
			)
			.footer({ text: 'Tanmay types, you ignore — but babygirl, please read this once?' });

		const menu = new StringSelectMenuBuilder()
			.setCustomId('menu')
			.setPlaceholder('Select a category to explore')
			.setMaxValues(1)
			.addOptions([
				{
					label: 'Home',
					value: 'home',
					emoji: client.emoji.info,
				},
				...categories.map(category => ({
					label: `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`,
					value: category,
					emoji: client.emoji.info,
				})),
				{
					label: 'All Commands',
					value: 'all',
					emoji: client.emoji.info,
				},
			]);

		const reply = await ctx.reply({
			embeds: [embed],
			components: [new ActionRowBuilder().addComponents(menu)],
		});

		const collector = reply.createMessageComponentCollector({
			idle: 30000,
			filter: i => filter(i, ctx),
		});

		collector.on('collect', async interaction => {
			await interaction.deferUpdate();
			const selected = interaction.values[0];

			switch (selected) {
				case 'home':
					await reply.edit({ embeds: [embed] });
					break;

				case 'all':
					const allEmbed = client.embed().desc(
						Object.entries(allCommands)
							.sort((a, b) => a[0].length - b[0].length)
							.map(([cat, cmds]) =>
								`${client.emoji.info} **${cat.charAt(0).toUpperCase() + cat.slice(1)} Commands**\n` +
								cmds.map(cmd => `\`${cmd.name}\``).join(', ')
							).join('\n\n')
					);
					await reply.edit({ embeds: [allEmbed] });
					break;

				default:
					const selectedCommands = allCommands[selected] || [];
					const categoryEmbed = client.embed()
						.title(`${client.emoji.info} ${selected.charAt(0).toUpperCase() + selected.slice(1)} Commands`)
						.desc(
							selectedCommands.length
								? selectedCommands.map(cmd =>
									`${client.emoji.info1} **\`${cmd.name.padEnd(11)} - \`** \`${cmd.description.padEnd(33)}\``
								).join('\n')
								: `${client.emoji.cross} \`No commands available in this category.\``
						);
					await reply.edit({ embeds: [categoryEmbed] });
					break;
			}
		});

		collector.on('end', async () => {
			await reply.edit({ components: [] }).catch(() => null);
		});
	}
}