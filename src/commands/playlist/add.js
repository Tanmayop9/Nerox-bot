/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Add track to playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistAdd extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-add';
        this.aliases = ['pladd', 'playlist-add'];
        this.usage = '<playlist> <song>';
        this.description = 'Add a track to your playlist';
        this.options = [
            {
                name: 'playlist',
                required: true,
                opType: 'string',
                description: 'Playlist name',
            },
            {
                name: 'song',
                required: true,
                opType: 'string',
                description: 'Song to add',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (args.length < 2) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Usage: \`${client.prefix}pl-add <playlist> <song>\``)],
                });
            }

            const playlistName = args[0].toLowerCase();
            const query = args.slice(1).join(' ');
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (!playlists[playlistName]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist not found`')],
                });
            }

            // Check track limit (500 per playlist)
            if (playlists[playlistName].tracks.length >= 500) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist is full (max 500 tracks)`')],
                });
            }

            // Search for track
            const msg = await ctx.reply({
                embeds: [client.embed().desc('Searching...')],
            });

            const result = await client.manager.search(query, { requester: ctx.author });

            if (!result.tracks.length) {
                return await msg.edit({
                    embeds: [client.embed().desc('`No results found`')],
                });
            }

            const track = result.tracks[0];

            // Add track to playlist
            playlists[playlistName].tracks.push({
                title: track.title,
                uri: track.uri,
                duration: track.length || 0,
                author: track.author,
            });

            await client.db.playlists.set(userId, playlists);

            await msg.edit({
                embeds: [
                    client.embed().desc(
                        `Added **${track.title.substring(0, 50)}** to **${playlists[playlistName].name}**. ` +
                        `The playlist now has **${playlists[playlistName].tracks.length}** tracks.`
                    )
                ],
            });
        };
    }
}
