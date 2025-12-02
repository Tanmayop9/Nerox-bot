/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Import playlist from URL
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistImport extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-import';
        this.aliases = ['plimport', 'playlist-import'];
        this.usage = '<name> <url>';
        this.description = 'Import a playlist from Spotify/YouTube URL';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Name for the imported playlist',
            },
            {
                name: 'url',
                required: true,
                opType: 'string',
                description: 'Playlist URL to import',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (args.length < 2) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Usage: \`${client.prefix}pl-import <name> <url>\``)],
                });
            }

            const name = args[0].substring(0, 32);
            const url = args[1];
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (playlists[name.toLowerCase()]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`A playlist with that name already exists`')],
                });
            }

            if (Object.keys(playlists).length >= 25) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Maximum 25 playlists allowed`')],
                });
            }

            const msg = await ctx.reply({
                embeds: [client.embed().desc('Importing playlist...')],
            });

            // Search/resolve playlist
            const result = await client.manager.search(url, { requester: ctx.author });

            if (!result.tracks.length) {
                return await msg.edit({
                    embeds: [client.embed().desc('`Could not import playlist`')],
                });
            }

            // Limit to 500 tracks
            const tracks = result.tracks.slice(0, 500).map(t => ({
                title: t.title,
                uri: t.uri,
                duration: t.length || 0,
                author: t.author,
            }));

            playlists[name.toLowerCase()] = {
                name: name,
                tracks: tracks,
                createdAt: Date.now(),
            };

            await client.db.playlists.set(userId, playlists);

            await msg.edit({
                embeds: [
                    client.embed().desc(
                        `Imported **${result.playlistName || 'playlist'}** as **${name}** with **${tracks.length}** tracks. ` +
                        `${result.tracks.length > 500 ? '(Limited to 500 tracks)' : ''}`
                    )
                ],
            });
        };
    }
}
