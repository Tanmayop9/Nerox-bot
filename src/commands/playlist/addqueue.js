/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Add entire queue to playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistAddQueue extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-addqueue';
        this.aliases = ['pladdqueue', 'pl-savequeue'];
        this.usage = '<playlist>';
        this.playing = true;
        this.description = 'Add entire queue to a playlist';
        this.options = [
            {
                name: 'playlist',
                required: true,
                opType: 'string',
                description: 'Playlist to add queue to',
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

            const player = client.getPlayer(ctx);
            const current = player.queue.current;
            const queue = player.queue;

            // Combine current + queue
            const allTracks = [current, ...queue].filter(Boolean);

            if (!allTracks.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Queue is empty`')],
                });
            }

            // Check space
            const available = 500 - playlists[name].tracks.length;
            if (available <= 0) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist is full`')],
                });
            }

            let added = 0;
            for (const track of allTracks.slice(0, available)) {
                const exists = playlists[name].tracks.some(t => t.uri === track.uri);
                if (!exists) {
                    playlists[name].tracks.push({
                        title: track.title,
                        uri: track.uri,
                        duration: track.length || 0,
                        author: track.author,
                    });
                    added++;
                }
            }

            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Added **${added}** tracks from queue to **${playlists[name].name}**. ` +
                        `The playlist now has **${playlists[name].tracks.length}** tracks.`
                    )
                ],
            });
        };
    }
}
