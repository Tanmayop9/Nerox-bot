/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description StreamPlayer - Custom Music Player with multi-source support
 * A lightweight alternative to Kazagumo/Shoukaku/Erela.js
 */

import { EventEmitter } from 'events';
import {
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    entersState,
    StreamType,
} from '@discordjs/voice';
import ytdl from '@distube/ytdl-core';
import ytsr from '@distube/ytsr';
import { PlaybackQueue } from './PlaybackQueue.js';
import { MediaTrack } from './MediaTrack.js';

// Configuration constants
const HIGH_WATER_MARK = 1 << 22; // 4MB buffer (reduced from 33MB for better memory usage)

/**
 * StreamPlayer - Individual guild player instance
 */
export class StreamPlayer extends EventEmitter {
    constructor(manager, options) {
        super();
        this.manager = manager;
        this.client = manager.client;
        this.guildId = options.guildId;
        this.voiceId = options.voiceId;
        this.textId = options.textId;
        this.shardId = options.shardId || 0;
        this.deaf = options.deaf ?? true;

        // Player state
        this.queue = new PlaybackQueue();
        this.volume = 100;
        this.playing = false;
        this.paused = false;
        this.loop = 'none'; // none, track, queue
        this.position = 0;
        this.connected = false;

        // Audio components
        this.connection = null;
        this.audioPlayer = null;
        this.resource = null;

        // Data store (like Kazagumo)
        this.data = new Map();

        // Position tracking
        this._positionInterval = null;
        this._startTime = 0;
    }

    /**
     * Connect to voice channel
     */
    async connect() {
        try {
            const guild = this.client.guilds.cache.get(this.guildId);
            if (!guild) throw new Error('Guild not found');

            this.connection = joinVoiceChannel({
                channelId: this.voiceId,
                guildId: this.guildId,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: this.deaf,
            });

            await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);

            this.audioPlayer = createAudioPlayer();
            this.connection.subscribe(this.audioPlayer);

            this._setupListeners();
            this.connected = true;

            this.emit('connected');
            return this;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Setup audio player listeners
     */
    _setupListeners() {
        this.audioPlayer.on(AudioPlayerStatus.Idle, () => this._handleTrackEnd());
        this.audioPlayer.on(AudioPlayerStatus.Playing, () => this._handleTrackStart());
        this.audioPlayer.on('error', (error) => this._handleError(error));

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                this.destroy();
            }
        });

        this.connection.on(VoiceConnectionStatus.Destroyed, () => {
            this.destroy();
        });
    }

    /**
     * Handle track start
     */
    _handleTrackStart() {
        this.playing = true;
        this.paused = false;
        this._startTime = Date.now();

        // Position tracking
        if (this._positionInterval) clearInterval(this._positionInterval);
        this._positionInterval = setInterval(() => {
            if (this.playing && !this.paused) {
                this.position = Date.now() - this._startTime;
            }
        }, 1000);

        this.emit('trackStart', this, this.queue.current);
    }

    /**
     * Handle track end
     */
    async _handleTrackEnd() {
        if (this._positionInterval) {
            clearInterval(this._positionInterval);
            this._positionInterval = null;
        }
        this.position = 0;
        this.playing = false;

        this.emit('trackEnd', this, this.queue.current);

        // Handle loop modes
        if (this.loop === 'track' && this.queue.current) {
            return await this.play();
        }

        if (this.loop === 'queue' && this.queue.current) {
            this.queue.add(this.queue.current);
        }

        // Get next track
        const next = this.queue.next();

        if (next) {
            await this.play();
        } else {
            this.emit('queueEnd', this);
        }
    }

    /**
     * Handle player error
     */
    _handleError(error) {
        this.client.log(`NeroxPlayer error: ${error.message}`, 'error');
        this.emit('error', this, error);

        // Try to play next track
        if (this.queue.length > 0) {
            this.queue.next();
            this.play().catch(() => {});
        }
    }

    /**
     * Search for tracks
     */
    async search(query, options = {}) {
        try {
            const isUrl = query.startsWith('http://') || query.startsWith('https://');

            if (isUrl && ytdl.validateURL(query)) {
                const info = await ytdl.getBasicInfo(query);
                return {
                    type: 'TRACK',
                    tracks: [
                        new MediaTrack({
                            title: info.videoDetails.title,
                            author: info.videoDetails.author?.name || 'Unknown',
                            uri: info.videoDetails.video_url,
                            duration: parseInt(info.videoDetails.lengthSeconds) * 1000,
                            thumbnail: info.videoDetails.thumbnails[0]?.url,
                            isStream: info.videoDetails.isLiveContent,
                            requester: options.requester,
                            source: 'youtube',
                        }),
                    ],
                };
            }

            // Search YouTube
            const results = await ytsr(query, { limit: 10, safeSearch: false });
            const videos = results.items.filter((i) => i.type === 'video');

            return {
                type: 'SEARCH',
                tracks: videos.map(
                    (video) =>
                        new MediaTrack({
                            title: video.name,
                            author: video.author?.name || 'Unknown',
                            uri: video.url,
                            duration: this._parseDuration(video.duration),
                            thumbnail: video.thumbnails?.[0]?.url,
                            isStream: video.isLive,
                            requester: options.requester,
                            source: 'youtube',
                        })
                ),
            };
        } catch (error) {
            this.client.log(`Search error: ${error.message}`, 'error');
            return { type: 'EMPTY', tracks: [] };
        }
    }

    /**
     * Parse duration string to milliseconds
     */
    _parseDuration(duration) {
        if (!duration) return 0;
        const parts = duration.split(':').map(Number);
        if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
        if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
        return parts[0] * 1000;
    }

    /**
     * Play current track
     */
    async play() {
        const track = this.queue.current;
        if (!track) {
            if (this.queue.length > 0) {
                this.queue.next();
                return await this.play();
            }
            return false;
        }

        try {
            const stream = ytdl(track.uri, {
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: HIGH_WATER_MARK,
                dlChunkSize: 0,
            });

            this.resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary,
                inlineVolume: true,
            });

            if (this.resource.volume) {
                this.resource.volume.setVolume(this.volume / 100);
            }

            this.audioPlayer.play(this.resource);
            return true;
        } catch (error) {
            this.client.log(`Play error: ${error.message}`, 'error');
            this.emit('error', this, error);
            return false;
        }
    }

    /**
     * Pause playback
     */
    pause(state = true) {
        if (state) {
            this.audioPlayer.pause();
            this.paused = true;
        } else {
            this.audioPlayer.unpause();
            this.paused = false;
        }
        return this;
    }

    /**
     * Set volume
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(150, volume));
        if (this.resource?.volume) {
            this.resource.volume.setVolume(this.volume / 100);
        }
        return this;
    }

    /**
     * Seek to position (limited support with ytdl streams)
     * Note: Seeking with ytdl-core requires recreating the stream
     * which may cause brief audio interruption
     */
    async seek(position) {
        if (!this.queue.current) return this;

        // For NeroxPlayer, seeking is limited
        // We update the position for display purposes
        this.position = Math.max(0, Math.min(position, this.queue.current.duration || 0));
        this.client.log('Seek position updated (stream seek not fully supported)', 'debug');

        return this;
    }

    /**
     * Skip current track
     */
    async skip() {
        this.audioPlayer.stop();
        return this;
    }

    /**
     * Stop playback
     */
    stop() {
        this.queue.clear();
        this.audioPlayer.stop();
        return this;
    }

    /**
     * Set loop mode
     */
    setLoop(mode) {
        this.loop = mode; // 'none', 'track', 'queue'
        return this;
    }

    /**
     * Destroy player
     */
    destroy() {
        if (this._positionInterval) {
            clearInterval(this._positionInterval);
        }

        this.queue.clear();
        this.playing = false;
        this.connected = false;

        if (this.audioPlayer) {
            this.audioPlayer.stop();
        }

        if (this.connection) {
            this.connection.destroy();
        }

        this.manager.players.delete(this.guildId);
        this.emit('destroy', this);
    }

    /**
     * Get shoukaku-like interface for compatibility
     */
    get shoukaku() {
        return {
            stopTrack: () => this.skip(),
            setPaused: (state) => this.pause(state),
            setVolume: (vol) => this.setVolume(vol * 100),
        };
    }
}
