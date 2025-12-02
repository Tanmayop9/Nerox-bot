/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Clone a playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistClone extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-clone';
        this.aliases = ['plclone', 'playlist-clone', 'pl-copy'];
        this.usage = '<playlist> <new name>';
        this.description = 'Clone a playlist with a new name';
        this.options = [
            {
                name: 'playlist',
                required: true,
                opType: 'string',
                description: 'Playlist to clone',
            },
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Name for the clone',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (args.length < 2) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Usage: \`${client.prefix}pl-clone <playlist> <new name>\``)],
                });
            }

            const sourceName = args[0].toLowerCase();
            const newName = args.slice(1).join(' ').substring(0, 32);
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (!playlists[sourceName]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Source playlist not found`')],
                });
            }

            if (playlists[newName.toLowerCase()]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`A playlist with that name already exists`')],
                });
            }

            if (Object.keys(playlists).length >= 25) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Maximum 25 playlists allowed`')],
                });
            }

            // Clone playlist
            const source = playlists[sourceName];
            playlists[newName.toLowerCase()] = {
                name: newName,
                tracks: [...source.tracks],
                createdAt: Date.now(),
            };

            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Cloned **${source.name}** to **${newName}** with **${source.tracks.length}** tracks.`
                    )
                ],
            });
        };
    }
}
