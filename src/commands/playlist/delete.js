/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Delete a playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistDelete extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-delete';
        this.aliases = ['pldelete', 'playlist-delete', 'pl-remove'];
        this.usage = '<name>';
        this.description = 'Delete a playlist';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Playlist name to delete',
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

            const playlistName = playlists[name].name;
            delete playlists[name];
            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [client.embed().desc(`Deleted playlist **${playlistName}**`)],
            });
        };
    }
}
