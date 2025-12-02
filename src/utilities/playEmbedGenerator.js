/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Now playing embed generator
 */

import { progressBar } from '../toolkit/progressIndicator.js';

export const generatePlayEmbed = (client, player) => {
    const track = player.queue?.current;

    if (!track) {
        return client.embed().desc(`${client.emoji.cross} No track information available.`);
    }

    const { title, author, thumbnail, artworkUrl } = track;
    const duration = track.length || track.duration || 0;
    const position = player.position || 0;
    const queueSize = player.queue?.length || 0;

    // Build description
    let description = `**${(title || 'Unknown').substring(0, 50)}${(title || '').length > 50 ? '...' : ''}**\n`;
    description += `${author || 'Unknown Artist'}\n\n`;

    // Duration info
    if (track.isStream) {
        description += `${client.emoji.music} \`◉ LIVE\``;
    } else if (duration > 0) {
        description += progressBar(position, duration, 15) + '\n';
        description += `\`${client.formatDuration(position)}\` / \`${client.formatDuration(duration)}\``;
    }

    description += `\n\n${client.emoji.queue} Queue: **${queueSize}** tracks`;

    const embed = client
        .embed()
        .desc(description)
        .footer({
            text: `Requested by ${track.requester?.displayName || track.requester?.username || 'Unknown'}`,
        });

    // Add thumbnail if available
    const thumb = thumbnail || artworkUrl;
    if (thumb) {
        embed.thumb(thumb);
    }

    return embed;
};
