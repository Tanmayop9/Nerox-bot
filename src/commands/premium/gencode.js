/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Generate premium codes (Owner only)
 */

import crypto from 'crypto';
import { Command } from '../../classes/abstract/command.js';

export default class GenerateCode extends Command {
    constructor() {
        super(...arguments);
        this.name = 'gencode';
        this.aliases = ['generatecode', 'createcode'];
        this.usage = '<days> [count] [plan]';
        this.description = 'Generate premium codes';
        this.owner = true;
        this.options = [
            {
                name: 'days',
                required: true,
                opType: 'integer',
                description: 'Duration in days',
            },
            {
                name: 'count',
                required: false,
                opType: 'integer',
                description: 'Number of codes to generate (default: 1)',
            },
            {
                name: 'plan',
                required: false,
                opType: 'string',
                description: 'Plan type (standard/plus/ultimate)',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const days = parseInt(args[0]);
            const count = Math.min(parseInt(args[1]) || 1, 25); // Max 25 codes at once
            const plan = args[2]?.toLowerCase() || 'standard';

            if (isNaN(days) || days < 1 || days > 365) {
                return await ctx.reply({
                    embeds: [client.embed().desc('Duration must be between 1-365 days.')],
                });
            }

            const validPlans = ['standard', 'plus', 'ultimate'];
            if (!validPlans.includes(plan)) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`Invalid plan. Choose from: ${validPlans.join(', ')}`)],
                });
            }

            const msg = await ctx.reply({
                embeds: [client.embed().desc(`Generating ${count} premium code(s)...`)],
            });

            const codes = [];

            for (let i = 0; i < count; i++) {
                // Generate unique code: NEROX-XXXX-XXXX-XXXX
                const code = `NEROX-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

                await client.db.redeemCodes.set(code, {
                    duration: days,
                    plan: plan,
                    createdBy: ctx.author.id,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // Code expires in 30 days if not used
                    usedBy: null,
                    usedAt: null,
                });

                codes.push(code);
            }

            const codeList = codes.map((c, i) => `\`${i + 1}.\` \`${c}\``).join('\n');

            await msg.edit({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `Generated **${count}** premium code(s) for **${days} days** (${plan}):\n\n${codeList}\n\n` +
                                `Codes are valid for 30 days from generation.`
                        ),
                ],
            });

            // DM the codes to the owner for safety
            await ctx.author
                .send({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `**Premium Codes Generated**\n\n` +
                                    `Duration: ${days} days\n` +
                                    `Plan: ${plan}\n\n` +
                                    `${codeList}`
                            ),
                    ],
                })
                .catch(() => null);
        };
    }
}
