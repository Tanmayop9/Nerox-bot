/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Track start event handler
 */

import moment from 'moment';
import { ActionRowBuilder } from 'discord.js';
import { generatePlayEmbed } from '../../../services/PlayEmbedGeneratorService.js';

const event = 'trackStart';

export default class PlayerStart {
    constructor() {
        this.name = event;
    }

    async execute(client, player, track) {
        if (!track?.title || !player?.textId) return;

        player.data.set('autoplayFromTrack', track);

        const channel = client.channels.cache.get(player.textId);
        if (!channel?.isTextBased() || !('send' in channel)) return;

        const requesterId = track.requester?.id || 'unknown';
        const liked = (await client.db.liked.get(requesterId).catch(() => [])) || [];
        const isLiked = liked.some((t) => t.uri === track.uri);

        try {
            // Send now playing embed with controls
            const playEmbed = await channel.send({
                embeds: [generatePlayEmbed(client, player)],
                components: [
                    new ActionRowBuilder().addComponents([
                        client.button().secondary(`playEmbedButton_${player.guildId}_prev`, '', client.emoji.previous),
                        client.button().secondary(`playEmbedButton_${player.guildId}_pause`, '', client.emoji.pause),
                        client.button().secondary(`playEmbedButton_${player.guildId}_next`, '', client.emoji.next),
                        client.button().secondary(`playEmbedButton_${player.guildId}_stop`, '', client.emoji.stop),
                    ]),
                    new ActionRowBuilder().addComponents([
                        client
                            .button()[player.data?.get('autoplayStatus') ? 'success' : 'secondary'](`playEmbedButton_${player.guildId}_autoplay`, '', client.emoji.autoplay),
                        client
                            .button()[isLiked ? 'success' : 'secondary'](`playEmbedButton_${player.guildId}_like`, '', client.emoji.heart),
                    ]),
                ],
            });

            player.data.set('playEmbed', playEmbed);
        } catch (err) {
            client.log(`Failed to send now playing embed: ${err.message}`, 'error');
        }

        // Update statistics
        const date = moment().tz('Asia/Kolkata').format('DD-MM-YYYY');

        try {
            const [dailyCount, totalCount, userCount, guildCount] = await Promise.all([
                client.db.stats.songsPlayed.get(date).catch(() => 0),
                client.db.stats.songsPlayed.get('total').catch(() => 0),
                client.db.stats.songsPlayed.get(requesterId).catch(() => 0),
                client.db.stats.songsPlayed.get(player.guildId).catch(() => 0),
            ]);

            await Promise.all([
                client.db.stats.songsPlayed.set(date, (dailyCount ?? 0) + 1),
                client.db.stats.songsPlayed.set('total', (totalCount ?? 0) + 1),
                client.db.stats.songsPlayed.set(requesterId, (userCount ?? 0) + 1),
                client.db.stats.songsPlayed.set(player.guildId, (guildCount ?? 0) + 1),
            ]);
        } catch (err) {
            client.log(`Error updating song stats: ${err.message}`, 'error');
        }

        // Log to webhook
        if (client.webhooks?.playerLogs) {
            await client.webhooks.playerLogs
                .send({
                    username: 'Nerox Player',
                    avatarURL: client.user?.displayAvatarURL(),
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `Now playing **${(track.title || 'Unknown').substring(0, 40)}** in **${client.guilds.cache.get(player.guildId)?.name?.substring(0, 25) || 'Unknown'}** ` +
                                    `requested by **${track.requester?.tag || track.requester?.username || 'Unknown'}**.`
                            ),
                    ],
                })
                .catch(() => null);
        }
    }
}
