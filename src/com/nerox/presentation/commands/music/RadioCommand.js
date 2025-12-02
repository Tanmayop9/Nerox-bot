/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Radio command - Listen to radio stations
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { filter } from '../../../infrastructure/handlers/ContentFilter.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';

const radioStations = {
    rap: 'https://www.youtube.com/watch?v=1y2R_i2OeFw',
    lofi: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    chill: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    jazz: 'https://www.youtube.com/watch?v=Dx5qFachd3A',
};

export default class Radio extends Command {
    constructor() {
        super(...arguments);
        this.inVC = true;
        this.aliases = ['rad'];
        this.description = 'Listen to radio stations';

        this.execute = async (client, ctx) => {
            const voiceChannel = ctx.member.voice.channel;

            if (!voiceChannel) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} You must be in a voice channel.`)],
                });
            }

            // Create player if needed
            let player = client.getPlayer(ctx);

            if (!player) {
                const useLavalink = client.lavalinkReady && client.manager?.players;

                if (useLavalink) {
                    player = await client.manager.createPlayer({
                        deaf: true,
                        guildId: ctx.guild.id,
                        textId: ctx.channel.id,
                        shardId: ctx.guild.shardId,
                        voiceId: voiceChannel.id,
                    });
                } else if (client.neroxPlayer) {
                    player = await client.neroxPlayer.createPlayer({
                        guildId: ctx.guild.id,
                        textId: ctx.channel.id,
                        shardId: ctx.guild.shardId,
                        voiceId: voiceChannel.id,
                        deaf: true,
                    });
                }
            }

            const options = Object.entries(radioStations).map(([label, value], index) => ({
                value,
                emoji: client.emoji.music,
                label: `${index + 1}. ${label.charAt(0).toUpperCase() + label.substring(1)}`,
            }));

            const menu = new StringSelectMenuBuilder()
                .setMinValues(1)
                .setMaxValues(1)
                .addOptions(options)
                .setCustomId('radio_menu')
                .setPlaceholder('Select a radio station');

            const reply = await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.info} Select a radio station below.`)],
                components: [new ActionRowBuilder().addComponents(menu)],
            });

            const collector = reply.createMessageComponentCollector({
                idle: 30000,
                filter: async (interaction) => await filter(interaction, ctx),
            });

            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate();

                const result = await player.search(interaction.values[0], {
                    requester: ctx.author,
                });

                if (!result.tracks?.[0]) {
                    await reply.edit({
                        embeds: [client.embed().desc(`${client.emoji.cross} Radio station unavailable.`)],
                        components: [],
                    });
                    return;
                }

                player.queue.add(result.tracks[0]);

                if (!player.playing && !player.paused) {
                    if (!player.queue.current) {
                        player.queue.next();
                    }
                    await player.play();
                }

                await reply.edit({
                    embeds: [client.embed().desc(`${client.emoji.check} Now playing radio station.`)],
                    components: [],
                });
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    await reply.edit({
                        embeds: [client.embed().desc(`${client.emoji.warn} Radio selection timed out.`)],
                        components: [],
                    });
                }
            });
        };
    }
}
