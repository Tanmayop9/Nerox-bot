/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Discord Client with advanced features
 */

import moment from 'moment';
import { readdirSync } from 'fs';
import { Manager } from './audioManager.js';
import { fileURLToPath } from 'node:url';
import { emoji } from '../resources/emoticons.js';
import format from 'moment-duration-format';
import { josh } from '../utilities/databaseProvider.js';
import { log } from '../chronicle.js';
import { dirname, resolve } from 'node:path';
import { ExtendedEmbedBuilder } from './embedBuilder.js';
import { ExtendedButtonBuilder } from './buttonFactory.js';
import { OAuth2Scopes } from 'discord-api-types/v10';
import { readyEvent } from '../utilities/bootSequence.js';
import { Client, Partials, Collection, GatewayIntentBits, WebhookClient } from 'discord.js';
import { ClusterClient, getInfo } from 'discord-hybrid-sharding';
import { config } from './configuration.js';

format(moment);
const __dirname = dirname(fileURLToPath(import.meta.url));

export class ExtendedClient extends Client {
    constructor() {
        super({
            partials: [
                Partials.User,
                Partials.Channel,
                Partials.Message,
                Partials.Reaction,
                Partials.GuildMember,
                Partials.ThreadMember,
                Partials.GuildScheduledEvent,
            ],
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessageReactions,
            ],
            failIfNotExists: false,
            shards: getInfo().SHARD_LIST,
            shardCount: getInfo().TOTAL_SHARDS,
            allowedMentions: {
                repliedUser: false,
                parse: ['users', 'roles'],
            },
        });

        // Core configuration
        this.emoji = emoji;
        this.config = config;
        this.prefix = config.prefix || '&';
        this.owners = config.owners || [];
        this.admins = config.admins || [];
        this.underMaintenance = false;
        this.lavalinkReady = false;

        // Initialize music manager (supports Lavalink, ytdl-core, NeroxPlayer)
        this.manager = Manager.init(this);

        // Database collections
        this.db = {
            // User management
            noPrefix: josh('noPrefix'),
            botmods: josh('botmods'),
            botstaff: josh('botstaff'),
            serverstaff: josh('serverstaff'),
            blacklist: josh('blacklist'),

            // Server settings
            prefix: josh('prefix'),
            ignore: josh('ignore'),
            vcRequests: josh('vcRequests'),

            // Music features
            liked: josh('liked'),
            twoFourSeven: josh('twoFourSeven'),

            // Premium system
            premium: josh('premium'),
            redeemCodes: josh('redeemCodes'),

            // Statistics
            stats: {
                songsPlayed: josh('stats/songsPlayed'),
                commandsUsed: josh('stats/commandsUsed'),
            },
        };

        // Dokdo debugger (optional)
        this.dokdo = null;

        // Invite generator
        this.invite = {
            admin: () =>
                this.generateInvite({
                    scopes: [OAuth2Scopes.Bot],
                    permissions: ['Administrator'],
                }),
            required: () =>
                this.generateInvite({
                    scopes: [OAuth2Scopes.Bot],
                    permissions: ['Administrator'],
                }),
        };

        // Cluster client for sharding
        this.cluster = new ClusterClient(this);

        // Command collections
        this.commands = new Collection();
        this.categories = readdirSync(resolve(__dirname, '../orchestrator'));
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

        // Format bytes to human readable
        this.formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const power = Math.floor(Math.log(bytes) / Math.log(1024));
            const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
            return `${parseFloat((bytes / Math.pow(1024, power)).toFixed(2))} ${units[power]}`;
        };

        // Format duration
        this.formatDuration = (duration) => {
            return moment.duration(duration, 'milliseconds').format('d[d] h[h] m[m] s[s]', { trim: 'all' }) || '0s';
        };

        // Get player for guild (supports both Lavalink and NeroxPlayer)
        this.getPlayer = (ctx) => {
            const guildId = ctx.guild?.id;
            if (!guildId) return null;

            // Check Lavalink manager first
            if (this.manager.players?.get) {
                const player = this.manager.players.get(guildId);
                if (player) return player;
            }

            // Check NeroxPlayer
            if (this.neroxPlayer?.players?.get) {
                return this.neroxPlayer.players.get(guildId);
            }

            return null;
        };

        // Initialize webhooks
        this.initWebhooks();

        // Event listeners
        this.on('debug', (data) => this.log(data, 'debug'));
        this.on('ready', async () => await readyEvent(this));
        this.on('messageUpdate', (_, m) => (m.partial ? null : this.emit('messageCreate', m)));
    }

    // Initialize webhook clients
    initWebhooks() {
        const webhookConfig = this.config.webhooks || {};
        this.webhooks = {};

        for (const [name, url] of Object.entries(webhookConfig)) {
            if (url && url.startsWith('https://discord.com/api/webhooks/')) {
                try {
                    this.webhooks[name] = new WebhookClient({ url });
                } catch (_e) {
                    this.log(`Failed to initialize webhook: ${name}`, 'error');
                }
            }
        }
    }

    // Check if user is premium
    async isPremium(userId) {
        const data = await this.db.premium.get(userId);
        return data && data.expiresAt > Date.now();
    }

    // Check if server is premium
    async isServerPremium(guildId) {
        return await this.db.serverstaff.has(guildId);
    }
}
