/**
 * @nerox v4.0.0
 * @author Tanmay
 * @description Advanced Play Command with intelligent queue management
 */

import { Command } from '../../classes/abstract/command.js';

export default class Play extends Command {
    constructor() {
        super(...arguments);
        this.inSameVC = true;
        this.aliases = ['p'];
        this.usage = '<query>';
        this.description = 'Play music using a search query or URL';
        this.options = [
            {
                name: 'query',
                required: true,
                opType: 'string',
                isAutoComplete: true,
                description: 'Song name, URL, or playlist link',
            },
        ];

        this.execute = async (client, ctx, args) => {
            // Validate query input
            if (!args.length) {
                return await ctx.reply({
                    embeds: [
                        client.embed()
                            .desc(`${client.emoji.cross} Please provide a song name or URL to play.`)
                    ],
                });
            }

            // Get existing player or create new one
            const player = client.getPlayer(ctx) ||
                (await client.manager.createPlayer({
                    deaf: true,
                    guildId: ctx.guild.id,
                    textId: ctx.channel.id,
                    shardId: ctx.guild.shardId,
                    voiceId: ctx.member.voice.channel.id,
                }));

            // Show searching message
            const waitEmbed = await ctx.reply({
                embeds: [
                    client.embed()
                        .desc(`${client.emoji.timer} Searching for your track, please wait...`),
                ],
            });

            // Search for tracks
            const result = await player.search(args.join(' '), {
                requester: ctx.author,
            });

            // Handle no results
            if (!result.tracks.length) {
                return await waitEmbed.edit({
                    embeds: [
                        client.embed()
                            .desc(`${client.emoji.cross} No results found for your query.`)
                    ],
                });
            }

            const tracks = result.tracks;
            let addedCount = 0;

            // Handle playlist
            if (result.type === 'PLAYLIST') {
                for (const track of tracks) {
                    // Skip tracks shorter than 30 seconds
                    if (track.length && track.length < 30000) continue;
                    player.queue.add(track);
                    addedCount++;
                }
            } else {
                // Handle single track
                const track = tracks[0];
                
                // Validate track duration (except for bot owners)
                if (track.length < 30000 && !client.owners.includes(ctx.author.id)) {
                    return await waitEmbed.edit({
                        embeds: [
                            client.embed()
                                .desc(`${client.emoji.cross} Tracks shorter than 30 seconds cannot be played.`),
                        ],
                    });
                }
                
                player.queue.add(track);
                addedCount = 1;
            }

            // Build success message
            const description = result.type === 'PLAYLIST'
                ? `${client.emoji.check} Added **${addedCount}** tracks from **${result.playlistName}** to the queue.`
                : `${client.emoji.check} Added **${tracks[0].title}** to the queue.`;

            // Start playback if not already playing
            if (!player.playing && !player.paused) {
                player.play();
            }

            // Update embed with success message
            await waitEmbed.edit({
                embeds: [client.embed().desc(description)],
            });
        };
    }
}
