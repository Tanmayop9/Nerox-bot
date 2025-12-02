/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Add currently playing track to playlist
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistAddCurrent extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-addcurrent';
        this.aliases = ['pladdcurrent', 'pl-save', 'pl-savenow'];
        this.usage = '<playlist>';
        this.playing = true;
        this.description = 'Add current track to a playlist';
        this.options = [
            {
                name: 'playlist',
                required: true,
                opType: 'string',
                description: 'Playlist to add track to',
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

            if (playlists[name].tracks.length >= 500) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Playlist is full (max 500 tracks)`')],
                });
            }

            const player = client.getPlayer(ctx);
            const track = player.queue.current;

            // Check if already in playlist
            const exists = playlists[name].tracks.some(t => t.uri === track.uri);
            if (exists) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Track already in playlist`')],
                });
            }

            playlists[name].tracks.push({
                title: track.title,
                uri: track.uri,
                duration: track.length || 0,
                author: track.author,
            });

            await client.db.playlists.set(userId, playlists);

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Added **${track.title.substring(0, 50)}** to **${playlists[name].name}**.`
                    )
                ],
            });
        };
    }
}
