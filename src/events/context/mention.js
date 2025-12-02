/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Bot mention handler
 */

import { limited } from '../../utils/ratelimiter.js';

const event = 'mention';

export default class Mention {
    constructor() {
        this.name = event;
    }

    execute = async (client, ctx) => {
        // Check rate limit
        if (limited(ctx.author.id)) {
            return client.emit('blUser', ctx);
        }

        const prefix = (await client.db.prefix.get(ctx.guild?.id)) || client.prefix;

        await ctx.reply({
            embeds: [
                client
                    .embed()
                    .desc(
                        `Hey ${ctx.author}! I'm **Nerox**, your music companion.\n\n` +
                            `My prefix here is \`${prefix}\`. Use \`${prefix}help\` to see all commands.`
                    ),
            ],
        });
    };
}
