/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Giveaway command with premium/noPrefix reward integration
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Giveaway extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['gw', 'gstart'];
        this.description = 'Create and manage giveaways with premium/noPrefix rewards';
        this.userPerms = ['ManageGuild'];
        this.options = [
            {
                opType: 'subcommand',
                name: 'start',
                description: 'Start a new giveaway',
                options: [
                    { opType: 'string', name: 'prize', description: 'What are you giving away?', required: true },
                    { opType: 'string', name: 'duration', description: 'Duration (e.g., 1h, 1d, 1w)', required: true },
                    {
                        opType: 'number',
                        name: 'winners',
                        description: 'Number of winners (default: 1)',
                        required: false,
                    },
                    { opType: 'string', name: 'reward', description: 'Auto-grant reward type', required: false },
                    {
                        opType: 'string',
                        name: 'reward_duration',
                        description: 'Premium duration (e.g., 30d)',
                        required: false,
                    },
                ],
            },
            {
                opType: 'subcommand',
                name: 'end',
                description: 'End a giveaway early',
                options: [{ opType: 'string', name: 'message_id', description: 'Giveaway message ID', required: true }],
            },
            {
                opType: 'subcommand',
                name: 'reroll',
                description: 'Reroll giveaway winners',
                options: [
                    { opType: 'string', name: 'message_id', description: 'Giveaway message ID', required: true },
                    { opType: 'number', name: 'winners', description: 'Number of new winners', required: false },
                ],
            },
            {
                opType: 'subcommand',
                name: 'list',
                description: 'List active giveaways',
            },
        ];
    }

    async execute(client, ctx, args) {
        const subcommand = ctx.getSubcommand?.() || args[0]?.toLowerCase();

        if (subcommand === 'start' || !subcommand || args.length >= 2) {
            return this.startGiveaway(client, ctx, args);
        } else if (subcommand === 'end') {
            return this.endGiveaway(client, ctx, args);
        } else if (subcommand === 'reroll') {
            return this.rerollGiveaway(client, ctx, args);
        } else if (subcommand === 'list') {
            return this.listGiveaways(client, ctx);
        }

        return ctx.reply({
            embeds: [
                client
                    .embed()
                    .title('🎉 Giveaway Commands')
                    .desc(
                        '**Start a giveaway:**\n' +
                            '`!giveaway start <prize> <duration> [winners] [reward_type] [reward_duration]`\n\n' +
                            '**Reward Types:**\n' +
                            '• `premium` - Grant premium access to main Nerox bot\n' +
                            '• `noprefix` - Grant no-prefix access to main Nerox bot\n\n' +
                            '**Examples:**\n' +
                            '`!giveaway start "1 Month Premium" 1d 1 premium 30d`\n' +
                            '`!giveaway start "No-Prefix Access" 12h 2 noprefix`\n' +
                            '`!giveaway start "Discord Nitro" 7d 1`\n\n' +
                            '**Other commands:**\n' +
                            '`!giveaway end <message_id>`\n' +
                            '`!giveaway reroll <message_id> [winners]`\n' +
                            '`!giveaway list`'
                    ),
            ],
        });
    }

    async startGiveaway(client, ctx, args) {
        let prize, duration, winnerCount, rewardType, rewardDuration;

        // Handle slash command
        if (ctx.interaction) {
            prize = ctx.getOption('prize');
            duration = ctx.getOption('duration');
            winnerCount = ctx.getOption('winners') || 1;
            rewardType = ctx.getOption('reward')?.toLowerCase();
            rewardDuration = ctx.getOption('reward_duration');
        } else {
            // Parse from message args: !giveaway start "prize" duration winners rewardType rewardDuration
            // Or: !giveaway "prize" duration winners rewardType rewardDuration
            const startIndex = args[0]?.toLowerCase() === 'start' ? 1 : 0;

            // Extract quoted prize or first arg
            const content = args.slice(startIndex).join(' ');
            const quoteMatch = content.match(/^["'](.+?)["']\s*/);

            if (quoteMatch) {
                prize = quoteMatch[1];
                const remaining = content.slice(quoteMatch[0].length).split(/\s+/);
                duration = remaining[0];
                winnerCount = parseInt(remaining[1]) || 1;
                rewardType = remaining[2]?.toLowerCase();
                rewardDuration = remaining[3];
            } else {
                prize = args[startIndex];
                duration = args[startIndex + 1];
                winnerCount = parseInt(args[startIndex + 2]) || 1;
                rewardType = args[startIndex + 3]?.toLowerCase();
                rewardDuration = args[startIndex + 4];
            }
        }

        if (!prize || !duration) {
            return ctx.reply({
                embeds: [
                    client
                        .embed('#F23F43')
                        .desc(
                            '❌ **Usage:** `!giveaway start "<prize>" <duration> [winners] [reward_type] [reward_duration]`\n\n' +
                                '**Example:** `!giveaway start "1 Month Premium" 1d 1 premium 30d`'
                        ),
                ],
            });
        }

        // Parse duration
        const durationMs = client.parseDuration(duration);
        if (!durationMs || durationMs < 60000) {
            return ctx.reply({
                embeds: [
                    client
                        .embed('#F23F43')
                        .desc('❌ Invalid duration. Minimum is 1 minute. Examples: `1m`, `1h`, `1d`, `1w`'),
                ],
            });
        }

        // Validate reward type
        if (rewardType && !['premium', 'noprefix'].includes(rewardType)) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Invalid reward type. Use `premium` or `noprefix`.')],
            });
        }

        // Parse reward duration for premium
        let rewardDurationMs = null;
        if (rewardType === 'premium') {
            rewardDurationMs = rewardDuration ? client.parseDuration(rewardDuration) : 30 * 24 * 60 * 60 * 1000; // Default 30 days
        }

        const endsAt = Date.now() + durationMs;

        // Create giveaway embed
        const embed = client
            .embed('#E91E63')
            .title('🎉 GIVEAWAY 🎉')
            .desc(
                `**Prize:** ${prize}\n\n` +
                    `**Winners:** ${winnerCount}\n` +
                    `**Ends:** <t:${Math.floor(endsAt / 1000)}:R>\n` +
                    `**Hosted by:** ${ctx.author}\n\n` +
                    (rewardType
                        ? `🎁 **Auto-Reward:** ${rewardType === 'premium' ? `⭐ Premium (${client.formatDuration(rewardDurationMs)})` : '🚀 No-Prefix'}\n\n`
                        : '') +
                    'React with 🎉 to enter!'
            )
            .footer({ text: 'Ends at' })
            .setTimestamp(endsAt);

        // Send giveaway message
        const message = await ctx.channel.send({ embeds: [embed] });
        await message.react('🎉');

        // Save to database
        await client.db.giveaways.set(message.id, {
            messageId: message.id,
            channelId: ctx.channel.id,
            guildId: ctx.guild.id,
            hostId: ctx.author.id,
            prize,
            winnerCount,
            endsAt,
            ended: false,
            rewardType: rewardType || null,
            rewardDuration: rewardDurationMs,
            rewardPlan:
                rewardType === 'premium' ? `Giveaway Premium (${client.formatDuration(rewardDurationMs)})` : null,
            createdAt: Date.now(),
        });

        // Confirm
        if (ctx.interaction) {
            await ctx.reply({
                embeds: [client.embed('#23A55A').desc(`✅ Giveaway started! ${message.url}`)],
                ephemeral: true,
            });
        } else {
            await ctx.message?.delete().catch(() => null);
        }
    }

    async endGiveaway(client, ctx, args) {
        const messageId = ctx.getOption?.('message_id') || args[1];

        if (!messageId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a giveaway message ID.')],
            });
        }

        const giveaway = await client.db.giveaways.get(messageId);
        if (!giveaway) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Giveaway not found.')],
            });
        }

        if (giveaway.ended) {
            return ctx.reply({
                embeds: [client.embed('#F0B232').desc('⚠️ This giveaway has already ended.')],
            });
        }

        const winners = await client.endGiveaway(messageId);

        await ctx.reply({
            embeds: [
                client
                    .embed('#23A55A')
                    .desc(
                        winners?.length
                            ? `✅ Giveaway ended! Winners: ${winners.map((id) => `<@${id}>`).join(', ')}`
                            : '✅ Giveaway ended with no valid entries.'
                    ),
            ],
        });
    }

    async rerollGiveaway(client, ctx, args) {
        const messageId = ctx.getOption?.('message_id') || args[1];
        const winnerCount = ctx.getOption?.('winners') || parseInt(args[2]) || 1;

        if (!messageId) {
            return ctx.reply({
                embeds: [client.embed('#F23F43').desc('❌ Please provide a giveaway message ID.')],
            });
        }

        const result = await client.rerollGiveaway(messageId, winnerCount);

        if (result.success) {
            await ctx.reply({
                embeds: [
                    client
                        .embed('#23A55A')
                        .desc(`✅ Rerolled! New winners: ${result.winners.map((id) => `<@${id}>`).join(', ')}`),
                ],
            });
        } else {
            await ctx.reply({
                embeds: [client.embed('#F23F43').desc(`❌ ${result.error}`)],
            });
        }
    }

    async listGiveaways(client, ctx) {
        const allGiveaways = (await client.db.giveaways.entries) || [];
        const activeGiveaways = allGiveaways.filter(([, g]) => g.guildId === ctx.guild.id && !g.ended);

        if (activeGiveaways.length === 0) {
            return ctx.reply({
                embeds: [client.embed().desc('📭 No active giveaways in this server.')],
            });
        }

        const list = activeGiveaways
            .map(([id, g]) => {
                const reward = g.rewardType ? ` | 🎁 ${g.rewardType === 'premium' ? 'Premium' : 'No-Prefix'}` : '';
                return `• **${g.prize}** - Ends <t:${Math.floor(g.endsAt / 1000)}:R>${reward}\n  ID: \`${id}\``;
            })
            .join('\n\n');

        await ctx.reply({
            embeds: [client.embed('#E91E63').title('🎉 Active Giveaways').desc(list)],
        });
    }
}
