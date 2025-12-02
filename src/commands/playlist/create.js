/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Create a new playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistCreate extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-create';
        this.aliases = ['plcreate', 'playlist-create'];
        this.usage = '<name>';
        this.description = 'Create a new playlist';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Name for your playlist',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (!args.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Provide a playlist name`')],
                });
            }

            const name = args.join(' ').substring(0, 32);
            const userId = ctx.author.id;

            // Get user's playlists
            const playlists = (await client.db.playlists?.get(userId)) || {};

            // Check playlist limit (max 25)
            if (Object.keys(playlists).length >= 25) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Maximum 25 playlists allowed`')],
                });
            }

            // Check if name exists
            if (playlists[name.toLowerCase()]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist already exists`')],
                });
            }

            // Create playlist
            playlists[name.toLowerCase()] = {
                name: name,
                tracks: [],
                createdAt: Date.now(),
            };

            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [client.embed().desc(`Created playlist **${name}**`)],
            });
        };
    }
}
