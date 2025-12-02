/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description View playlist tracks
 */

import _ from 'lodash';
import { Command } from '../../classes/abstract/command.js';
import { paginator } from '../../utils/paginator.js';

export default class PlaylistView extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-view';
        this.aliases = ['plview', 'playlist-view', 'pl-info'];
        this.usage = '<name>';
        this.description = 'View tracks in a playlist';
        this.options = [
            {
                name: 'name',
                required: true,
                opType: 'string',
                description: 'Playlist name to view',
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

            const playlist = playlists[name];

            if (!playlist.tracks.length) {
                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `**${playlist.name}** is empty. Add tracks with \`${client.prefix}pl-add ${name} <song>\`.`
                        )
                    ],
                });
            }

            // Calculate total duration
            const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
            const durationStr = client.formatDuration(totalDuration);

            // Paginate tracks
            const chunks = _.chunk(playlist.tracks, 10);
            const pages = chunks.map((chunk, i) => {
                const startIdx = i * 10;
                const trackList = chunk
                    .map((t, j) => `**${startIdx + j + 1}.** ${t.title.substring(0, 40)}`)
                    .join('\n');

                return client.embed()
                    .desc(
                        `**${playlist.name}** has **${playlist.tracks.length}** tracks with a total duration of **${durationStr}**.\n\n${trackList}`
                    )
                    .footer({ text: `Page ${i + 1}/${chunks.length}` });
            });

            await paginator(ctx, pages);
        };
    }
}
