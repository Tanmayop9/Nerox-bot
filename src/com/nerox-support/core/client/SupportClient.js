/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Discord Client for support server management
 */

import moment from 'moment';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { emoji } from '../../resources/constants/Emoticons.js';
import format from 'moment-duration-format';
import { josh, mainBotJosh } from '../../domain/database/DatabaseProvider.js';
import { log } from '../logging/LoggerService.js';
import { dirname, resolve } from 'node:path';
import { ExtendedEmbedBuilder } from './builders/EmbedBuilder.js';
import { ExtendedButtonBuilder } from './builders/ButtonBuilder.js';
import { Client, Partials, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './ConfigurationProvider.js';

format(moment);
const __dirname = dirname(fileURLToPath(import.meta.url));

export class SupportClient extends Client {
    constructor() {
        super({
            partials: [Partials.User, Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildMessageReactions,
            ],
            failIfNotExists: false,
            allowedMentions: {
                repliedUser: false,
                parse: ['users', 'roles'],
            },
        });

        // Core configuration
        this.emoji = emoji;
        this.config = config;
        this.prefix = config.prefix || '!';
        this.owners = config.owners || [];
        this.admins = config.admins || [];

        // Database collections
        this.db = {
            // Ticket system
            tickets: josh('tickets'),
            ticketSettings: josh('ticketSettings'),
            ticketCount: josh('ticketCount'),

            // Giveaway system
            giveaways: josh('giveaways'),

            // Moderation
            warns: josh('warns'),
            modLogs: josh('modLogs'),

            // Welcome system
            welcomeSettings: josh('welcomeSettings'),

            // Auto-role system
            autoRoles: josh('autoRoles'),

            // Staff
            blacklist: josh('blacklist'),
        };

        // Main Nerox bot database (for premium/noPrefix giveaways)
        this.mainDb = {
            premium: mainBotJosh('premium'),
            noPrefix: mainBotJosh('noPrefix'),
        };

        // Command collections
        this.commands = new Collection();
        this.categories = readdirSync(resolve(__dirname, '../../presentation/commands'));
        this.cooldowns = new Collection();

        // Gateway connection
        this.connectToGateway = () => {
            this.login(config.token);
            return this;
        };

        // Utility methods
        this.log = (message, type) => log(message, type);
        this.sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

        // Builders
        this.button = () => new ExtendedButtonBuilder();
        this.embed = (color) => new ExtendedEmbedBuilder(color || '#2B2D31');

        // Format duration
        this.formatDuration = (duration) => {
            return moment.duration(duration, 'milliseconds').format('d[d] h[h] m[m] s[s]', { trim: 'all' }) || '0s';
        };

        // Parse duration string to milliseconds
        this.parseDuration = (str) => {
            const regex =
                /(\d+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks)/gi;
            let totalMs = 0;
            let match;

            while ((match = regex.exec(str)) !== null) {
                const value = parseInt(match[1]);
                const unit = match[2].toLowerCase();

                if (unit.startsWith('s')) totalMs += value * 1000;
                else if (unit.startsWith('m')) totalMs += value * 60 * 1000;
                else if (unit.startsWith('h')) totalMs += value * 60 * 60 * 1000;
                else if (unit.startsWith('d')) totalMs += value * 24 * 60 * 60 * 1000;
                else if (unit.startsWith('w')) totalMs += value * 7 * 24 * 60 * 60 * 1000;
            }

            return totalMs || null;
        };

        // Event listeners
        this.on('debug', (data) => this.log(data, 'debug'));
        this.on('ready', () => this.onReady());
    }

    async onReady() {
        this.log(`Logged in as ${this.user.tag}`, 'success');
        this.log(`Serving ${this.guilds.cache.size} guilds`, 'info');

        // Set presence
        this.user.setPresence({
            activities: [{ name: 'Support Tickets | !help', type: 3 }],
            status: 'online',
        });

        // Start giveaway scheduler
        this.startGiveawayScheduler();
    }

    // Giveaway scheduler - checks for ended giveaways every 30 seconds
    startGiveawayScheduler() {
        setInterval(async () => {
            try {
                const allGiveaways = await this.db.giveaways.entries;
                const now = Date.now();

                for (const [messageId, giveaway] of allGiveaways) {
                    if (giveaway.ended) continue;
                    if (giveaway.endsAt <= now) {
                        await this.endGiveaway(messageId);
                    }
                }
            } catch (error) {
                this.log(`Giveaway scheduler error: ${error.message}`, 'error');
            }
        }, 30000); // Check every 30 seconds
    }

    // End a giveaway and pick winners
    async endGiveaway(messageId) {
        try {
            const giveaway = await this.db.giveaways.get(messageId);
            if (!giveaway || giveaway.ended) return null;

            const channel = await this.channels.fetch(giveaway.channelId).catch(() => null);
            if (!channel) return null;

            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (!message) return null;

            // Get reaction users
            const reaction = message.reactions.cache.get('🎉');
            let users = [];

            if (reaction) {
                const fetchedUsers = await reaction.users.fetch();
                users = fetchedUsers.filter((u) => !u.bot).map((u) => u.id);
            }

            // Pick winners
            const winners = [];
            const winnerCount = Math.min(giveaway.winnerCount, users.length);

            for (let i = 0; i < winnerCount; i++) {
                const randomIndex = Math.floor(Math.random() * users.length);
                winners.push(users.splice(randomIndex, 1)[0]);
            }

            // Update database
            await this.db.giveaways.set(messageId, {
                ...giveaway,
                ended: true,
                winners,
            });

            // Update message
            const embed = this.embed('#E91E63')
                .title('🎉 GIVEAWAY ENDED 🎉')
                .desc(
                    `**Prize:** ${giveaway.prize}\n\n**Winners:** ${winners.length > 0 ? winners.map((id) => `<@${id}>`).join(', ') : 'No valid entries'}`
                )
                .footer({ text: 'Ended at' })
                .setTimestamp();

            await message.edit({ embeds: [embed] });

            // Grant rewards to winners (premium/noPrefix for main bot)
            if (winners.length > 0) {
                await this.grantGiveawayRewards(giveaway, winners, channel);

                await channel.send({
                    content: `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!\n${message.url}`,
                });
            } else {
                await channel.send({
                    content: `No valid entries for the giveaway of **${giveaway.prize}**.`,
                });
            }

            return winners;
        } catch (error) {
            this.log(`Error ending giveaway: ${error.message}`, 'error');
            return null;
        }
    }

    // Grant rewards to giveaway winners (premium/noPrefix in main bot's database)
    async grantGiveawayRewards(giveaway, winners, channel) {
        if (!giveaway.rewardType) return;

        try {
            for (const winnerId of winners) {
                if (giveaway.rewardType === 'premium') {
                    // Grant premium to winner in main bot's database
                    const duration = giveaway.rewardDuration || 30 * 24 * 60 * 60 * 1000; // Default 30 days
                    const expiresAt = Date.now() + duration;

                    await this.mainDb.premium.set(winnerId, {
                        oderId: `GIVEAWAY-${giveaway.messageId || Date.now()}`,
                        oderedBy: winnerId,
                        oderedAt: Date.now(),
                        planName: giveaway.rewardPlan || 'Giveaway Premium',
                        planDuration: this.formatDuration(duration),
                        expiresAt: expiresAt,
                    });

                    // Also grant noPrefix access
                    await this.mainDb.noPrefix.set(winnerId, true);

                    this.log(
                        `Granted premium to ${winnerId} (expires: ${new Date(expiresAt).toISOString()})`,
                        'success'
                    );
                } else if (giveaway.rewardType === 'noprefix') {
                    // Grant no-prefix to winner in main bot's database (simple true value)
                    await this.mainDb.noPrefix.set(winnerId, true);

                    this.log(`Granted no-prefix to ${winnerId}`, 'success');
                }
            }

            // Send confirmation in channel
            const rewardName = giveaway.rewardType === 'premium' ? '⭐ Premium Access' : '🚀 No-Prefix Access';
            const durationText =
                giveaway.rewardType === 'premium'
                    ? ` for **${this.formatDuration(giveaway.rewardDuration || 30 * 24 * 60 * 60 * 1000)}**`
                    : '';

            await channel.send({
                embeds: [
                    this.embed('#23A55A')
                        .title('🎁 Rewards Granted!')
                        .desc(
                            `${rewardName} has been automatically granted to the winners${durationText}!\n\n` +
                                'Winners can now use their reward in the main Nerox bot.'
                        ),
                ],
            });
        } catch (error) {
            this.log(`Error granting giveaway rewards: ${error.message}`, 'error');
            await channel.send({
                embeds: [
                    this.embed('#F0B232').desc('⚠️ There was an issue auto-granting rewards. Please contact staff.'),
                ],
            });
        }
    }

    // Reroll giveaway winners
    async rerollGiveaway(messageId, winnerCount = 1) {
        try {
            const giveaway = await this.db.giveaways.get(messageId);
            if (!giveaway) return { success: false, error: 'Giveaway not found' };

            const channel = await this.channels.fetch(giveaway.channelId).catch(() => null);
            if (!channel) return { success: false, error: 'Channel not found' };

            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (!message) return { success: false, error: 'Message not found' };

            // Get reaction users
            const reaction = message.reactions.cache.get('🎉');
            let users = [];

            if (reaction) {
                const fetchedUsers = await reaction.users.fetch();
                users = fetchedUsers.filter((u) => !u.bot && !giveaway.winners?.includes(u.id)).map((u) => u.id);
            }

            // Pick new winners
            const winners = [];
            const count = Math.min(winnerCount, users.length);

            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * users.length);
                winners.push(users.splice(randomIndex, 1)[0]);
            }

            if (winners.length === 0) {
                return { success: false, error: 'No valid entries for reroll' };
            }

            // Announce new winners
            await channel.send({
                content: `🎉 New winner(s): ${winners.map((id) => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!\n${message.url}`,
            });

            return { success: true, winners };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
