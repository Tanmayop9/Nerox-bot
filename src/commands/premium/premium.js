/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description View premium status
 */

import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../classes/abstract/command.js';
import { filter } from '../../utils/filter.js';

export default class Premium extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['prem', 'vip'];
        this.description = 'View premium status and benefits';

        this.execute = async (client, ctx) => {
            const userId = ctx.author.id;
            const premiumData = await client.db.premium.get(userId);

            const isPremium = premiumData && premiumData.expiresAt > Date.now();

            // Premium benefits
            const benefits = [
                '**Unlimited Playlists** — Create up to 100 playlists',
                '**Extended Queue** — Queue up to 1000 tracks',
                '**24/7 Mode** — Keep the bot in VC forever',
                '**Audio Filters** — Access all audio filters',
                '**No Cooldowns** — Use commands without limits',
                '**Priority Support** — Get help faster',
            ];

            if (isPremium) {
                const expiryDate = new Date(premiumData.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });

                const daysLeft = Math.ceil((premiumData.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

                const statusEmbed = client
                    .embed()
                    .desc(
                        `You are a **Premium** member! Your subscription expires on **${expiryDate}** (${daysLeft} days remaining).\n\n` +
                            `**Your Benefits:**\n${benefits.map((b) => `› ${b}`).join('\n')}`
                    )
                    .footer({
                        text: `Plan: ${premiumData.plan || 'Standard'} • Member since ${new Date(premiumData.since).toLocaleDateString()}`,
                    });

                return await ctx.reply({ embeds: [statusEmbed] });
            }

            // Non-premium user
            const promoEmbed = client
                .embed()
                .desc(
                    `Upgrade to **Premium** and unlock the full potential of Nerox!\n\n` +
                        `**Premium Benefits:**\n${benefits.map((b) => `› ${b}`).join('\n')}\n\n` +
                        `Use \`${client.prefix}redeem <code>\` if you have a code, or contact support to get premium.`
                )
                .footer({ text: 'Premium • Elevate your music experience' });

            const row = new ActionRowBuilder().addComponents(
                client.button().link('Get Premium', client.config.links?.support || 'https://discord.gg/nerox')
            );

            await ctx.reply({ embeds: [promoEmbed], components: [row] });
        };
    }
}
