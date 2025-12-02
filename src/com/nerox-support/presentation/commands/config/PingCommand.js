/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Ping command
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Ping extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['latency'];
        this.description = 'Check bot latency';
    }

    async execute(client, ctx) {
        const start = Date.now();
        const msg = await ctx.reply({
            embeds: [client.embed().desc('🏓 Pinging...')],
        });

        const latency = Date.now() - start;
        const wsLatency = Math.round(client.ws.ping);

        await msg.edit({
            embeds: [
                client
                    .embed('#23A55A')
                    .title('🏓 Pong!')
                    .desc(`**Bot Latency:** ${latency}ms\n` + `**API Latency:** ${wsLatency}ms`),
            ],
        });
    }
}
