/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Minimalist now playing embed generator
 */

export const generatePlayEmbed = (client, player) => {
    const track = player.queue.current;
    
    if (!track) {
        return client.embed().desc('`No track information available`');
    }

    const { title, author, uri } = track;
    const duration = track.isStream ? '`LIVE`' : `\`${client.formatDuration(track.length || 0)}\``;
    const position = player.queue.previous?.length || 0;
    const queueSize = player.queue.length || 0;

    // Minimalist embed design
    return client.embed()
        .desc(
            `**${title.substring(0, 50)}${title.length > 50 ? '...' : ''}**\n` +
            `${author}\n\n` +
            `${duration} · Queue: ${queueSize} tracks`
        )
        .footer({
            text: `${track.requester?.displayName || 'Unknown'}`,
        });
};
