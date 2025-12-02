/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Join command - Connect bot to voice channel
 */

import { filter } from '../../../infrastructure/handlers/ContentFilter.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';
import { ActionRowBuilder } from 'discord.js';

export default class Join extends Command {
    constructor() {
        super(...arguments);
        this.inVC = true;
        this.aliases = ['j', 'move', 'connect'];
        this.description = 'Join or move the bot to your voice channel';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const voiceChannel = ctx.member.voice.channel;

            if (!player || !ctx.guild.members.me?.voice.channelId) {
                // Destroy existing player if any
                if (player) await player.destroy().catch(() => null);

                try {
                    // Create new player
                    const useLavalink = client.lavalinkReady && client.manager.players;

                    if (useLavalink) {
                        await client.manager.createPlayer({
                            deaf: true,
                            guildId: ctx.guild.id,
                            textId: ctx.channel.id,
                            shardId: ctx.guild.shardId,
                            voiceId: voiceChannel.id,
                        });
                    } else {
                        await client.neroxPlayer.createPlayer({
                            guildId: ctx.guild.id,
                            textId: ctx.channel.id,
                            shardId: ctx.guild.shardId,
                            voiceId: voiceChannel.id,
                            deaf: true,
                        });
                    }

                    await ctx.reply({
                        embeds: [
                            client
                                .embed()
                                .desc(
                                    `${client.emoji.check} Successfully joined voice channel\n` +
                                        `${client.emoji.info} **Voice Channel:** ${voiceChannel}\n` +
                                        `${client.emoji.info1} **Text Channel:** ${ctx.channel}`
                                ),
                        ],
                    });
                } catch (error) {
                    await ctx.reply({
                        embeds: [
                            client.embed().desc(`${client.emoji.cross} Failed to join voice channel: ${error.message}`),
                        ],
                    });
                }
                return;
            }

            // Player exists - offer to move
            const reply = await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            (player.queue?.current
                                ? `${client.emoji.warn} People are listening to songs in ${ctx.guild.members.me.voice.channel}.\n`
                                : `${client.emoji.info} I am already connected to ${ctx.guild.members.me.voice.channel}.\n`) +
                                `${client.emoji.info} This changes 24/7 config and player's text channel too.`
                        ),
                ],
                components: [new ActionRowBuilder().addComponents([client.button().secondary('move', 'Move me')])],
            });

            const collector = reply.createMessageComponentCollector({
                idle: 10000,
                filter: async (interaction) => await filter(interaction, ctx),
            });

            collector.on('collect', async (interaction) => {
                collector.stop();
                await interaction.deferUpdate();

                player.textId = ctx.channel.id;
                await ctx.guild.members.me.voice.setChannel(voiceChannel.id);

                await reply.edit({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `${client.emoji.check} Operation Successful\n` +
                                    `${client.emoji.info} **Voice Channel:** ${voiceChannel}\n` +
                                    `${client.emoji.info1} **Text Channel:** ${ctx.channel}`
                            ),
                    ],
                    components: [],
                });

                // Update 24/7 config if enabled
                if (await client.db.twoFourSeven.has(player.guildId)) {
                    await client.db.twoFourSeven.set(player.guildId, {
                        textId: player.textId,
                        voiceId: voiceChannel.id,
                    });
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size) return;
                await reply.edit({
                    embeds: [
                        client
                            .embed()
                            .desc(reply.embeds[0].description)
                            .footer({ text: 'Join/move command timed out!' }),
                    ],
                    components: [],
                });
            });
        };
    }
}
