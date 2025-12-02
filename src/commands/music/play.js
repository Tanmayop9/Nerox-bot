/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Advanced Play Command with multi-source support
 * Automatically joins voice channel if not already connected
 */

import { Command } from '../../classes/abstract/command.js';

export default class Play extends Command {
    constructor() {
        super(...arguments);
        this.inVC = true;
        this.aliases = ['p'];
        this.usage = '<query>';
        this.description = 'Play music from YouTube, Spotify, or any URL';
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
                    embeds: [client.embed().desc(`${client.emoji.cross} Please provide a song name or URL to play.`)],
                });
            }

            const query = args.join(' ');
            const voiceChannel = ctx.member.voice.channel;

            // Check if user is in voice channel
            if (!voiceChannel) {
                return await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(`${client.emoji.cross} You must be in a voice channel to use this command.`),
                    ],
                });
            }

            // Show searching message
            const waitEmbed = await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.timer} Searching for your track...`)],
            });

            try {
                // Get existing player
                let player = client.getPlayer(ctx);
                const botVoice = ctx.guild.members.me?.voice;
                const botInVC = botVoice?.channelId;

                // Check if we need to create a new player or join a different channel
                const needsNewPlayer = !player || !botInVC;
                const needsMove = botInVC && botInVC !== voiceChannel.id;

                if (needsMove) {
                    // Bot is in a different voice channel - check if user wants to move
                    return await waitEmbed.edit({
                        embeds: [
                            client
                                .embed()
                                .desc(
                                    `${client.emoji.cross} I'm already in ${botVoice.channel}. Use \`join\` command to move me.`
                                ),
                        ],
                    });
                }

                if (needsNewPlayer) {
                    // Destroy existing player if any
                    if (player) await player.destroy().catch(() => null);

                    // Check which player system to use
                    const useLavalink = client.lavalinkReady && client.manager?.players;

                    if (useLavalink) {
                        // Use Lavalink (Primary)
                        player = await client.manager.createPlayer({
                            deaf: true,
                            guildId: ctx.guild.id,
                            textId: ctx.channel.id,
                            shardId: ctx.guild.shardId,
                            voiceId: voiceChannel.id,
                        });
                        client.log(`Created Lavalink player for guild ${ctx.guild.id}`, 'info');
                    } else if (client.neroxPlayer) {
                        // Use NeroxPlayer (Custom wrapper)
                        player = await client.neroxPlayer.createPlayer({
                            guildId: ctx.guild.id,
                            textId: ctx.channel.id,
                            shardId: ctx.guild.shardId,
                            voiceId: voiceChannel.id,
                            deaf: true,
                        });
                        client.log(`Created NeroxPlayer for guild ${ctx.guild.id}`, 'info');
                    } else {
                        // Fallback error
                        return await waitEmbed.edit({
                            embeds: [
                                client
                                    .embed()
                                    .desc(
                                        `${client.emoji.cross} No music player available. Please configure Lavalink.`
                                    ),
                            ],
                        });
                    }
                }

                // Search for tracks
                const result = await player.search(query, {
                    requester: ctx.author,
                });

                // Handle no results
                if (!result.tracks || !result.tracks.length) {
                    return await waitEmbed.edit({
                        embeds: [client.embed().desc(`${client.emoji.cross} No results found for your query.`)],
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
                    const duration = track.length || track.duration || 0;
                    if (duration > 0 && duration < 30000 && !client.owners.includes(ctx.author.id)) {
                        return await waitEmbed.edit({
                            embeds: [
                                client
                                    .embed()
                                    .desc(`${client.emoji.cross} Tracks shorter than 30 seconds cannot be played.`),
                            ],
                        });
                    }

                    player.queue.add(track);
                    addedCount = 1;
                }

                // Build success message
                const description =
                    result.type === 'PLAYLIST'
                        ? `${client.emoji.check} Added **${addedCount}** tracks from **${result.playlistName || 'playlist'}** to the queue.`
                        : `${client.emoji.check} Added **${tracks[0].title.substring(0, 50)}** to the queue.`;

                // Start playback if not already playing
                if (!player.playing && !player.paused) {
                    if (!player.queue.current) {
                        player.queue.next();
                    }
                    await player.play();
                }

                // Update embed with success message
                await waitEmbed.edit({
                    embeds: [client.embed().desc(description)],
                });
            } catch (error) {
                client.log(`Play command error: ${error.message}`, 'error');
                await waitEmbed.edit({
                    embeds: [client.embed().desc(`${client.emoji.cross} An error occurred: ${error.message}`)],
                });
            }
        };
    }
}
