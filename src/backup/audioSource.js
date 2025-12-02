/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Backup audio source using @distube/ytdl-core when Lavalink is unavailable
 */

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

// Store active backup players
const backupPlayers = new Map();

/**
 * Check if Lavalink is available
 */
export const isLavalinkAvailable = (client) => {
    const nodes = client.manager?.shoukaku?.nodes;
    if (!nodes || nodes.size === 0) return false;

    for (const [, node] of nodes) {
        if (node.state === 2) return true;
    }
    return false;
};

/**
 * Search for tracks using ytsr
 */
export const searchTrack = async (query) => {
    try {
        if (ytdl.validateURL(query)) {
            const info = await ytdl.getBasicInfo(query);
            return {
                tracks: [
                    {
                        title: info.videoDetails.title,
                        uri: info.videoDetails.video_url,
                        duration: parseInt(info.videoDetails.lengthSeconds) * 1000,
                        thumbnail: info.videoDetails.thumbnails[0]?.url,
                        author: info.videoDetails.author?.name || 'Unknown',
                        isBackup: true,
                    },
                ],
            };
        }

        const results = await ytsr(query, { limit: 5, safeSearch: false });
        const videos = results.items.filter((i) => i.type === 'video');

        return {
            tracks: videos.map((video) => ({
                title: video.name,
                uri: video.url,
                duration: parseDuration(video.duration),
                thumbnail: video.thumbnails?.[0]?.url,
                author: video.author?.name || 'Unknown',
                isBackup: true,
            })),
        };
    } catch (error) {
        console.error('[BackupAudio] Search error:', error.message);
        return { tracks: [] };
    }
};

const parseDuration = (duration) => {
    if (!duration) return 0;
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
    return parts[0] * 1000;
};

/**
 * Create a backup player for a guild
 */
export const createBackupPlayer = async (client, options) => {
    const { guildId, voiceId, textId } = options;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return null;

    const voiceChannel = guild.channels.cache.get(voiceId);
    if (!voiceChannel) return null;

    const connection = joinVoiceChannel({
        channelId: voiceId,
        guildId: guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
        connection.destroy();
        throw new Error('Failed to connect to voice channel');
    }

    const audioPlayer = createAudioPlayer();
    connection.subscribe(audioPlayer);

    const backupPlayer = {
        guildId,
        voiceId,
        textId,
        connection,
        player: audioPlayer,
        queue: [],
        current: null,
        playing: false,
        paused: false,
        data: new Map(),

        addTrack(track) {
            this.queue.push(track);
        },

        async play() {
            if (this.queue.length === 0) {
                this.current = null;
                this.playing = false;
                return false;
            }

            const track = this.queue.shift();
            this.current = track;
            this.playing = true;

            try {
                const stream = ytdl(track.uri, {
                    filter: 'audioonly',
                    quality: 'highestaudio',
                    highWaterMark: 1 << 25,
                });

                const resource = createAudioResource(stream, {
                    inputType: StreamType.Arbitrary,
                });
                this.player.play(resource);
                return true;
            } catch (error) {
                console.error('[BackupAudio] Play error:', error.message);
                return this.play();
            }
        },

        pause() {
            if (this.playing && !this.paused) {
                this.player.pause();
                this.paused = true;
                return true;
            }
            return false;
        },

        resume() {
            if (this.paused) {
                this.player.unpause();
                this.paused = false;
                return true;
            }
            return false;
        },

        async skip() {
            this.player.stop();
            return await this.play();
        },

        destroy() {
            this.player.stop();
            this.connection.destroy();
            this.queue = [];
            this.current = null;
            this.playing = false;
            backupPlayers.delete(guildId);
        },
    };

    audioPlayer.on(AudioPlayerStatus.Idle, async () => {
        if (backupPlayer.queue.length > 0) {
            await backupPlayer.play();
            client.emit('backupTrackStart', backupPlayer);
        } else {
            backupPlayer.playing = false;
            client.emit('backupPlayerEmpty', backupPlayer);
        }
    });

    audioPlayer.on('error', (error) => {
        console.error('[BackupAudio] Error:', error.message);
        backupPlayer.skip();
    });

    backupPlayers.set(guildId, backupPlayer);
    return backupPlayer;
};

export const getBackupPlayer = (guildId) => backupPlayers.get(guildId);
export const isUsingBackup = (guildId) => backupPlayers.has(guildId);
export const destroyBackupPlayer = (guildId) => {
    const player = backupPlayers.get(guildId);
    if (player) {
        player.destroy();
        return true;
    }
    return false;
};
