/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Gift premium to a user (Owner only)
 */

import { Command } from '../../classes/abstract/command.js';

export default class GiftPremium extends Command {
    constructor() {
        super(...arguments);
        this.name = 'giftpremium';
        this.aliases = ['gp', 'givepremium'];
        this.usage = '<user> <days>';
        this.description = 'Gift premium to a user';
        this.owner = true;
        this.options = [
            {
                name: 'user',
                required: true,
                opType: 'user',
                description: 'User to gift premium',
            },
            {
                name: 'days',
                required: true,
                opType: 'integer',
                description: 'Duration in days',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const target = ctx.mentions.users?.first() || (await client.users.fetch(args[0]).catch(() => null));

            if (!target) {
                return await ctx.reply({
                    embeds: [client.embed().desc('User not found.')],
                });
            }

            const days = parseInt(args[1]);

            if (isNaN(days) || days < 1 || days > 365) {
                return await ctx.reply({
                    embeds: [client.embed().desc('Duration must be between 1-365 days.')],
                });
            }

            // Get current premium status
            const currentPremium = (await client.db.premium.get(target.id)) || {};
            const currentExpiry = currentPremium.expiresAt || Date.now();
            const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();

            // Calculate new expiry
            const durationMs = days * 24 * 60 * 60 * 1000;
            const newExpiry = baseTime + durationMs;

            // Update premium status
            await client.db.premium.set(target.id, {
                since: currentPremium.since || Date.now(),
                expiresAt: newExpiry,
                plan: currentPremium.plan || 'standard',
                giftedBy: ctx.author.id,
                redeemedCodes: currentPremium.redeemedCodes || [],
            });

            const expiryDate = new Date(newExpiry).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(
                            `Gifted **${days} days** of premium to **${target.tag}**.\n\n` +
                                `Their premium is now active until **${expiryDate}**.`
                        ),
                ],
            });

            // Notify the user
            await target
                .send({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `You've been gifted **${days} days** of Nerox Premium!\n\n` +
                                    `Your premium is now active until **${expiryDate}**. ` +
                                    `Enjoy all the premium features!`
                            ),
                    ],
                })
                .catch(() => null);
        };
    }
}
