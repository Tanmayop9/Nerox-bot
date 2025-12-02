/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Codebase statistics with paragraph-style UI
 */

import _ from 'lodash';
import { Command } from '../../../core/client/abstracts/CommandBase.js';
import { paginator } from '../../../infrastructure/handlers/PageNavigator.js';
import { getCodeStats } from '../../../infrastructure/handlers/CodeAnalyzer.js';

export default class CodeStats extends Command {
    constructor() {
        super(...arguments);
        this.dev = true;
        this.aliases = ['codestats', 'cs', 'codeinfo'];
        this.description = 'View codebase statistics';

        this.execute = async (client, ctx) => {
            const msg = await ctx.reply({
                embeds: [client.embed().desc('Analyzing codebase...')],
            });

            const stats = await getCodeStats();

            const mainEmbed = client
                .embed()
                .desc(
                    `The Nerox codebase consists of **${stats.files}** files across **${stats.directories}** directories. ` +
                        `There are **${stats.lines.toLocaleString()}** lines of code with **${stats.characters.toLocaleString()}** characters. ` +
                        `The project structure includes **${stats.whitespaces.toLocaleString()}** whitespace characters for formatting.`
                )
                .footer({ text: 'Nerox v4.0.0 Codebase' });

            const embeds = [mainEmbed];

            // Add tree pages
            const treeChunks = _.chunk(stats.tree, 25);
            treeChunks.forEach((chunk, i) => {
                embeds.push(
                    client
                        .embed()
                        .desc(`\`\`\`\n${chunk.join('\n')}\n\`\`\``)
                        .footer({
                            text: `File Tree • Page ${i + 2}/${treeChunks.length + 1}`,
                        })
                );
            });

            await msg.delete().catch(() => {});
            await paginator(ctx, embeds);
        };
    }
}
