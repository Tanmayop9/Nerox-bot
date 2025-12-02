/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Latency check with paragraph-style display
 */

import { Command } from '../../classes/abstract/command.js';

export default class Ping extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['latency', 'pong'];
        this.description = 'Check bot latency';
    }

    execute = async (client, ctx) => {
        const start = Date.now();
        const msg = await ctx.reply({ 
            embeds: [client.embed().desc('Measuring latency...')] 
        });
        const roundtrip = Date.now() - start;
        const ws = client.ws.ping;

        await msg.edit({
            embeds: [
                client.embed().desc(
                    `The WebSocket latency is **${ws}ms** and the message roundtrip took **${roundtrip}ms**. ` +
                    `${ws < 100 ? 'Connection is excellent!' : ws < 200 ? 'Connection is good.' : 'Connection might be slow.'}`
                )
            ]
        });
    };
}
