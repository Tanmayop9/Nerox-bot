/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Redeem a premium code
 */

import { Command } from '../../classes/abstract/command.js';

export default class Redeem extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['claim', 'activate'];
        this.usage = '<code>';
        this.description = 'Redeem a premium code';
        this.options = [
            {
                name: 'code',
                required: true,
                opType: 'string',
                description: 'Your premium code',
            },
        ];

        this.execute = async (client, ctx, args) => {
            if (!args.length) {
                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `To redeem a premium code, use \`${client.prefix}redeem <code>\`. ` +
                            `Premium codes can be obtained from giveaways or by contacting support.`
                        )
                    ],
                });
            }

            const code = args[0].toUpperCase().trim();
            const userId = ctx.author.id;

            // Check if code exists
            const codeData = await client.db.redeemCodes.get(code);

            if (!codeData) {
                return await ctx.reply({
                    embeds: [client.embed().desc('Invalid or expired code.')],
                });
            }

            // Check if code is already used
            if (codeData.usedBy) {
                return await ctx.reply({
                    embeds: [client.embed().desc('This code has already been redeemed.')],
                });
            }

            // Check if code is expired
            if (codeData.expiresAt && Date.now() > codeData.expiresAt) {
                await client.db.redeemCodes.delete(code);
                return await ctx.reply({
                    embeds: [client.embed().desc('This code has expired.')],
                });
            }

            // Get current premium status
            const currentPremium = await client.db.premium.get(userId) || {};
            const currentExpiry = currentPremium.expiresAt || Date.now();
            const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();

            // Calculate new expiry
            const durationMs = codeData.duration * 24 * 60 * 60 * 1000; // days to ms
            const newExpiry = baseTime + durationMs;

            // Update premium status
            await client.db.premium.set(userId, {
                since: currentPremium.since || Date.now(),
                expiresAt: newExpiry,
                plan: codeData.plan || 'standard',
                redeemedCodes: [...(currentPremium.redeemedCodes || []), code],
            });

            // Mark code as used
            await client.db.redeemCodes.set(code, {
                ...codeData,
                usedBy: userId,
                usedAt: Date.now(),
            });

            const expiryDate = new Date(newExpiry).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            await ctx.reply({
                embeds: [
                    client.embed().desc(
                        `Successfully redeemed **${codeData.duration} days** of premium!\n\n` +
                        `Your premium is now active until **${expiryDate}**. ` +
                        `Enjoy unlimited access to all premium features.`
                    )
                ],
            });
        };
    }
}
