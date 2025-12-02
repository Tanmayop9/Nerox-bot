/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Bot information with paragraph-style UI
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import os from 'os';
import moment from 'moment';
import { Command } from '../../classes/abstract/command.js';
import { filter } from '../../utils/filter.js';

export default class BotInfo extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['stats', 'bi'];
        this.description = 'View bot statistics';
    }

    async execute(client, ctx) {
        const servers = client.guilds.cache.size.toLocaleString();
        const users = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0).toLocaleString();
        const uptime = moment.duration(client.uptime).humanize();
        const ping = client.ws.ping;
        const channels = client.channels.cache.size.toLocaleString();
        const commands = client.commands.size;
        const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        
        // Get total songs played
        const totalSongs = (await client.db.stats?.songsPlayed?.get('total')) || 0;

        const mainEmbed = client.embed()
            .desc(
                `Nerox is currently serving **${servers}** servers with **${users}** users. ` +
                `The bot has been online for **${uptime}** with a latency of **${ping}ms**. ` +
                `So far, **${totalSongs.toLocaleString()}** songs have been played across all servers.`
            )
            .footer({ text: 'Nerox v4.0.0 • Made with ♡' });

        const systemEmbed = client.embed()
            .desc(
                `Nerox is running on **${os.platform()}** with **${os.arch()}** architecture. ` +
                `Currently using **${memory}MB** of memory on **Node.js ${process.version}**. ` +
                `The system has **${os.cpus().length}** CPU cores available.`
            )
            .footer({ text: 'System Information' });

        const statsEmbed = client.embed()
            .desc(
                `Nerox has **${commands}** commands loaded across **${client.categories.length}** categories. ` +
                `Managing **${channels}** channels on shard **${client.shard?.ids?.[0] || 0}** of **${client.options.shardCount || 1}**. ` +
                `Total songs played: **${totalSongs.toLocaleString()}**.`
            )
            .footer({ text: 'Performance Stats' });

        const menu = new StringSelectMenuBuilder()
            .setCustomId('botinfo')
            .setPlaceholder('Select view')
            .addOptions([
                { label: 'Overview', value: 'overview' },
                { label: 'System', value: 'system' },
                { label: 'Stats', value: 'stats' },
            ]);

        const msg = await ctx.reply({
            embeds: [mainEmbed],
            components: [new ActionRowBuilder().addComponents(menu)],
        });

        const collector = msg.createMessageComponentCollector({
            idle: 60000,
            filter: i => filter(i, ctx),
        });

        collector.on('collect', async interaction => {
            await interaction.deferUpdate();
            const choice = interaction.values[0];
            const embeds = { overview: mainEmbed, system: systemEmbed, stats: statsEmbed };
            await msg.edit({ embeds: [embeds[choice] || mainEmbed] });
        });

        collector.on('end', async () => {
            await msg.edit({ components: [] }).catch(() => null);
        });
    }
}
