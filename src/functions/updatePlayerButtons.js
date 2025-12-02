/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Update player control buttons
 */

import { ActionRowBuilder } from 'discord.js';

export const updatePlayerButtons = async (client, player) => {
    const playEmbed = player.data?.get('playEmbed');
    if (!playEmbed) return;

    const currentTrack = player.queue?.current;
    const requesterId = currentTrack?.requester?.id;

    // Fetch liked songs list
    const liked = requesterId ? (await client.db.liked.get(requesterId)) || [] : [];
    const isLiked = liked.some((x) => x.uri === currentTrack?.uri);

    const autoplayStatus = player.data?.get('autoplayStatus');

    const row1 = new ActionRowBuilder().addComponents([
        client.button().secondary(`playEmbedButton_${player.guildId}_prev`, '', client.emoji.previous),
        client
            .button()
            .secondary(
                `playEmbedButton_${player.guildId}_${player.paused ? 'resume' : 'pause'}`,
                '',
                player.paused ? client.emoji.resume : client.emoji.pause
            ),
        client.button().secondary(`playEmbedButton_${player.guildId}_next`, '', client.emoji.next),
        client.button().secondary(`playEmbedButton_${player.guildId}_stop`, '', client.emoji.stop),
    ]);

    const row2 = new ActionRowBuilder().addComponents([
        client
            .button()
            [
                autoplayStatus ? 'success' : 'secondary'
            ](`playEmbedButton_${player.guildId}_autoplay`, '', client.emoji.autoplay),
        client
            .button()
            [isLiked ? 'success' : 'secondary'](`playEmbedButton_${player.guildId}_like`, '', client.emoji.heart),
    ]);

    await playEmbed
        .edit({
            components: [row1, row2],
        })
        .catch(() => null);
};
