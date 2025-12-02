/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Queue display with minimalist pagination
 */

import _ from 'lodash';
import { paginator } from '../../utils/paginator.js';
import { Command } from '../../classes/abstract/command.js';

export default class Queue extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['q', 'list'];
        this.description = 'View the current queue';

        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const current = player.queue.current;
            const previous = player.queue.previous || [];
            const upcoming = player.queue || [];

            // Build queue entries
            const entries = [];

            // Previous tracks
            previous.forEach((t, i) => {
                entries.push(`\`${String(i + 1).padStart(2, '0')}\` ${t.title.substring(0, 35)}${t.title.length > 35 ? '...' : ''}`);
            });

            // Current track (highlighted)
            if (current) {
                const pos = previous.length + 1;
                entries.push(`\`${String(pos).padStart(2, '0')}\` **${current.title.substring(0, 35)}${current.title.length > 35 ? '...' : ''}** ◂`);
            }

            // Upcoming tracks
            upcoming.forEach((t, i) => {
                const pos = previous.length + 2 + i;
                entries.push(`\`${String(pos).padStart(2, '0')}\` ${t.title.substring(0, 35)}${t.title.length > 35 ? '...' : ''}`);
            });

            // Paginate
            const chunks = _.chunk(entries, 10);
            const pages = chunks.map((chunk, i) => 
                client.embed()
                    .desc(chunk.join('\n'))
                    .footer({ text: `Page ${i + 1}/${chunks.length} · ${entries.length} tracks` })
            );

            if (pages.length === 0) {
                return await ctx.reply({
                    embeds: [client.embed().desc('`Queue is empty`')],
                });
            }

            const startPage = Math.floor(previous.length / 10) || 0;
            await paginator(ctx, pages, startPage);
        };
    }
}
