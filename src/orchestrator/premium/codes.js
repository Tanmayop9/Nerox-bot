/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description List all premium codes (Owner only)
 */

import _ from 'lodash';
import { Command } from '../../framework/abstract/command.js';
import { paginator } from '../../toolkit/pageNavigator.js';

export default class ListCodes extends Command {
    constructor() {
        super(...arguments);
        this.name = 'codes';
        this.aliases = ['listcodes', 'allcodes'];
        this.description = 'List all premium codes';
        this.owner = true;
        this.options = [
            {
                name: 'filter',
                required: false,
                opType: 'string',
                description: 'Filter: unused, used, expired',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const filterType = args[0]?.toLowerCase();
            const allCodes = (await client.db.redeemCodes.entries) || [];

            if (!allCodes.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc('No premium codes found.')],
                });
            }

            let filteredCodes = allCodes;

            if (filterType === 'unused') {
                filteredCodes = allCodes.filter(([_, data]) => !data.usedBy);
            } else if (filterType === 'used') {
                filteredCodes = allCodes.filter(([_, data]) => data.usedBy);
            } else if (filterType === 'expired') {
                filteredCodes = allCodes.filter(
                    ([_, data]) => data.expiresAt && Date.now() > data.expiresAt && !data.usedBy
                );
            }

            if (!filteredCodes.length) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`No ${filterType || ''} codes found.`)],
                });
            }

            const codeEntries = filteredCodes.map(([code, data]) => {
                const status = data.usedBy ? '✓ Used' : data.expiresAt < Date.now() ? '✗ Expired' : '○ Active';
                return `\`${code}\` — ${data.duration}d (${data.plan}) — ${status}`;
            });

            const chunks = _.chunk(codeEntries, 10);
            const pages = chunks.map((chunk, i) =>
                client
                    .embed()
                    .desc(chunk.join('\n'))
                    .footer({
                        text: `Page ${i + 1}/${chunks.length} • ${filteredCodes.length} codes`,
                    })
            );

            await paginator(ctx, pages);
        };
    }
}
