/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Remove track from playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistRemove extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-remove';
        this.aliases = ['plremove', 'playlist-remove', 'pl-rm'];
        this.usage = '<playlist> <track number>';
        this.description = 'Remove a track from your playlist';
        this.options = [
            {
                name: 'playlist',
                required: true,
                opType: 'string',
                description: 'Playlist name',
            },
            {
                name: 'track',
                required: true,
                opType: 'integer',
                description: 'Track number to remove',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (args.length < 2) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Usage: \`${client.prefix}pl-remove <playlist> <track#>\``)],
                });
            }

            const playlistName = args[0].toLowerCase();
            const trackNum = parseInt(args[1]);
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (!playlists[playlistName]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist not found`')],
                });
            }

            const playlist = playlists[playlistName];

            if (isNaN(trackNum) || trackNum < 1 || trackNum > playlist.tracks.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`\`Invalid track number (1-${playlist.tracks.length})\``)],
                });
            }

            const removed = playlist.tracks.splice(trackNum - 1, 1)[0];
            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Removed **${removed.title.substring(0, 50)}** from **${playlist.name}**. ` +
                        `The playlist now has **${playlist.tracks.length}** tracks.`
                    )
                ],
            });
        };
    }
}
