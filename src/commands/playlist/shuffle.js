/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Play playlist in shuffle mode
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistShuffle extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-shuffle';
        this.aliases = ['plshuffle', 'playlist-shuffle'];
        this.usage = '<name>';
        this.inSameVC = true;
        this.description = 'Play playlist in shuffle mode';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Playlist name to shuffle play',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (!args.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Provide playlist name`')],
                });
            }

            const name = args.join(' ').toLowerCase();
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (!playlists[name]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist not found`')],
                });
            }

            const playlist = playlists[name];

            if (!playlist.tracks.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist is empty`')],
                });
            }

            // Get or create player
            const player = client.getPlayer(ctx) ||
                (await client.manager.createPlayer({
                    deaf: false,
                    guildId: ctx.guild.id,
                    textId: ctx.channel.id,
                    shardId: ctx.guild.shardId,
                    voiceId: ctx.member.voice.channel.id,
                }));

            const msg = await ctx.reply({
                embeds: [client.embed().desc(`Shuffling **${playlist.name}**...`)],
            });

            // Shuffle tracks
            const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
            let added = 0;

            for (const track of shuffled) {
                const result = await player.search(track.uri || track.title, {
                    requester: ctx.author,
                });

                if (result.tracks.length) {
                    player.queue.add(result.tracks[0]);
                    added++;
                }
            }

            if (!player.playing && !player.paused) {
                player.play();
            }

            await msg.edit({
                embeds: [
                    client.embed().desc(
                        `Shuffled and playing **${playlist.name}** with **${added}** tracks in random order.`
                    )
                ],
            });
        };
    }
}
