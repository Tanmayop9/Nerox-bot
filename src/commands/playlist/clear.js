/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Clear all tracks from a playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistClear extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-clear';
        this.aliases = ['plclear', 'playlist-clear'];
        this.usage = '<name>';
        this.description = 'Clear all tracks from a playlist';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Playlist name to clear',
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

            const trackCount = playlists[name].tracks.length;
            playlists[name].tracks = [];
            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Cleared **${trackCount}** tracks from **${playlists[name].name}**. The playlist is now empty.`
                    )
                ],
            });
        };
    }
}
