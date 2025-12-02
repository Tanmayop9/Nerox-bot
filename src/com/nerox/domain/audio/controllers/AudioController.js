/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description AudioController - Central music management system
 * Handles multiple players and provides unified API
 */

import { EventEmitter } from 'events';
import { Collection } from 'discord.js';
import { StreamPlayer } from '../services/StreamPlayer.js';

/**
 * AudioController - Manages all guild players
 */
export class AudioController extends EventEmitter {
    constructor(client, options = {}) {
        super();
        this.client = client;
        this.players = new Collection();
        this.defaultSearchEngine = options.defaultSearchEngine || 'youtube';

        // Bind client events for voice state updates
        this._setupClientEvents();
    }

    /**
     * Setup client voice state events
     */
    _setupClientEvents() {
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            const player = this.players.get(oldState.guild.id || newState.guild.id);
            if (!player) return;

            // Bot was disconnected
            if (oldState.member?.id === this.client.user?.id && !newState.channelId) {
                player.destroy();
            }

            // Handle empty channel
            const channel = newState.guild.channels.cache.get(player.voiceId);
            if (channel && channel.members.filter((m) => !m.user.bot).size === 0) {
                this.emit('playerEmpty', player);
            }
        });
    }

    /**
     * Create a new player for a guild
     */
    async createPlayer(options) {
        const existing = this.players.get(options.guildId);
        if (existing) return existing;

        const player = new StreamPlayer(this, options);

        // Forward events
        player.on('trackStart', (...args) => this.emit('playerStart', ...args));
        player.on('trackEnd', (...args) => this.emit('playerEnd', ...args));
        player.on('queueEnd', (...args) => this.emit('playerEmpty', ...args));
        player.on('error', (...args) => this.emit('playerError', ...args));
        player.on('destroy', (...args) => this.emit('playerDestroy', ...args));

        await player.connect();
        this.players.set(options.guildId, player);

        return player;
    }

    /**
     * Get existing player
     */
    get(guildId) {
        return this.players.get(guildId);
    }

    /**
     * Destroy a player
     */
    destroy(guildId) {
        const player = this.players.get(guildId);
        if (player) {
            player.destroy();
            return true;
        }
        return false;
    }

    /**
     * Search for tracks without requiring a player
     * Uses a temporary search-only player instance
     */
    async search(query, options = {}) {
        const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempPlayer = new StreamPlayer(this, { guildId: searchId });
        const result = await tempPlayer.search(query, options);
        // Cleanup - no need to destroy as it's not connected
        return result;
    }
}

export { StreamPlayer } from '../services/StreamPlayer.js';
export { PlaybackQueue } from '../queues/PlaybackQueue.js';
export { MediaTrack } from '../entities/MediaTrack.js';
