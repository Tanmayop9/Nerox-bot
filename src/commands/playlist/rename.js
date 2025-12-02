/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Rename a playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistRename extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-rename';
        this.aliases = ['plrename', 'playlist-rename'];
        this.usage = '<old name> <new name>';
        this.description = 'Rename a playlist';
        this.options = [
            {
                name: 'old',
                required: true,
                opType: 'string',
                description: 'Current playlist name',
            },
            {
                name: 'new',
                required: true,
                opType: 'string',
                description: 'New playlist name',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (args.length < 2) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Usage: \`${client.prefix}pl-rename <old> <new>\``)],
                });
            }

            const oldName = args[0].toLowerCase();
            const newName = args.slice(1).join(' ').substring(0, 32);
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};

            if (!playlists[oldName]) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist not found`')],
                });
            }

            if (playlists[newName.toLowerCase()] && oldName !== newName.toLowerCase()) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`A playlist with that name already exists`')],
                });
            }

            // Rename
            const playlist = playlists[oldName];
            const oldDisplayName = playlist.name;
            playlist.name = newName;

            if (oldName !== newName.toLowerCase()) {
                playlists[newName.toLowerCase()] = playlist;
                delete playlists[oldName];
            }

            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Renamed **${oldDisplayName}** to **${newName}**.`
                    )
                ],
            });
        };
    }
}
