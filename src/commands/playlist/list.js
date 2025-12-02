/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description List all playlists
 */

import { Command } from '../../classes/abstract/command.js';

export default class PlaylistList extends Command {
    constructor() {
        super(...arguments);
        this.name = 'pl-list';
        this.aliases = ['pllist', 'playlists', 'myplaylists'];
        this.description = 'View all your playlists';

        this.execute = async (client, ctx) => {
            const userId = ctx.author.id;
            const playlists = (await client.db.playlists?.get(userId)) || {};
            const entries = Object.values(playlists);

            if (!entries.length) {
                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `You don't have any playlists yet. Create one with \`${client.prefix}pl-create <name>\`.`
                        )
                    ],
                });
            }

            const list = entries
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((pl, i) => `**${i + 1}.** ${pl.name} — ${pl.tracks.length} tracks`)
                .join('\n');

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `You have **${entries.length}** playlist${entries.length > 1 ? 's' : ''}:\n\n${list}`
                    ).footer({ text: `Use ${client.prefix}pl-view <name> to see tracks` })
                ],
            });
        };
    }
}
