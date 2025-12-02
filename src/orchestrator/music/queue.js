/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Queue display with pagination
 */

import _ from 'lodash';
import { paginator } from '../../toolkit/pageNavigator.js';
import { Command } from '../../framework/abstract/command.js';

export default class Queue extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['q', 'list'];
        this.description = 'View the current queue';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);

            if (!player) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No player found.`)],
                });
            }

            const current = player.queue.current;
            const previous = player.queue.previous || [];
            const upcoming = [...(player.queue || [])];

            // Build queue entries
            const entries = [];

            // Previous tracks (greyed out)
            previous.slice(-5).forEach((t, i) => {
                entries.push(`\`${String(i + 1).padStart(2, '0')}\` ~~${(t.title || 'Unknown').substring(0, 35)}~~`);
            });

            // Current track (highlighted)
            if (current) {
                const pos = previous.length > 5 ? 6 : previous.length + 1;
                entries.push(
                    `\`${String(pos).padStart(2, '0')}\` **${(current.title || 'Unknown').substring(0, 35)}** ◂ Now`
                );
            }

            // Upcoming tracks
            upcoming.forEach((t, i) => {
                const pos = (previous.length > 5 ? 6 : previous.length) + 2 + i;
                entries.push(`\`${String(pos).padStart(2, '0')}\` ${(t.title || 'Unknown').substring(0, 35)}`);
            });

            if (entries.length === 0) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.queue} Queue is empty.`)],
                });
            }

            // Paginate
            const chunks = _.chunk(entries, 10);
            const pages = chunks.map((chunk, i) =>
                client
                    .embed()
                    .desc(`${client.emoji.queue} **Queue**\n\n${chunk.join('\n')}`)
                    .footer({
                        text: `Page ${i + 1}/${chunks.length} • ${entries.length} tracks`,
                    })
            );

            const startPage = Math.min(Math.floor((previous.length > 5 ? 5 : previous.length) / 10), pages.length - 1);
            await paginator(ctx, pages, startPage);
        };
    }
}
