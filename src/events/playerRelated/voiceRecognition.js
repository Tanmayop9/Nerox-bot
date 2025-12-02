/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description User-based Voice Recognition handler for music commands
 * 
 * This is a user-based system - only the user who enabled voice commands
 * will have their voice recognized for commands.
 * 
 * Note: Full speech-to-text requires external APIs (Google, Wit.ai, Vosk).
 * Connect your preferred speech recognition service in processVoiceCommand.
 */

import { updatePlayerButtons } from '../../functions/updatePlayerButtons.js';

// Store active voice sessions per user
const activeUsers = new Map();

// Supported voice commands
const voiceCommands = {
    play: {
        keywords: ['play', 'baja', 'chalao'],
        hasArgs: true,
        execute: async (client, userId, session, args) => {
            const player = client.manager.players.get(session.guildId);
            if (!player || !args) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            const result = await player.search(args, {
                requester: { id: userId, displayName: 'Voice Command' },
            });

            if (!result.tracks.length) {
                return await textChannel.send({
                    embeds: [client.embed().desc(`🎤 No results for "${args}".`)],
                });
            }

            const track = result.tracks[0];
            player.queue.add(track);

            if (!player.playing && !player.paused) {
                player.play();
            }

            await textChannel.send({
                embeds: [client.embed().desc(`🎤 Added **${track.title.substring(0, 45)}** to queue.`)],
            });
        },
    },

    skip: {
        keywords: ['skip', 'next', 'agla'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.queue?.current) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            const skipped = player.queue.current;
            await player.shoukaku.stopTrack();

            await textChannel.send({
                embeds: [client.embed().desc(`🎤 Skipped **${skipped.title.substring(0, 40)}**.`)],
            });
        },
    },

    stop: {
        keywords: ['stop', 'band', 'ruko'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player) return;

            const textChannel = client.channels.cache.get(session.textId);

            await player.destroy();

            if (textChannel) {
                await textChannel.send({
                    embeds: [client.embed().desc('🎤 Stopped playback.')],
                });
            }
        },
    },

    pause: {
        keywords: ['pause', 'rok'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.playing) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            player.pause(true);
            await updatePlayerButtons(client, player);

            await textChannel.send({
                embeds: [client.embed().desc('🎤 Paused.')],
            });
        },
    },

    resume: {
        keywords: ['resume', 'chalu', 'start'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.paused) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            player.pause(false);
            await updatePlayerButtons(client, player);

            await textChannel.send({
                embeds: [client.embed().desc('🎤 Resumed.')],
            });
        },
    },

    autoplay: {
        keywords: ['autoplay', 'auto'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.queue?.current) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            const status = player.data.get('autoplayStatus');
            status ? player.data.delete('autoplayStatus') : player.data.set('autoplayStatus', true);

            await updatePlayerButtons(client, player);

            await textChannel.send({
                embeds: [client.embed().desc(`🎤 Autoplay ${!status ? 'enabled' : 'disabled'}.`)],
            });
        },
    },
};

/**
 * Process voice command from a specific user
 * @param {Client} client - Discord client
 * @param {string} oderId - User ID who spoke
 * @param {string} transcript - Recognized speech text
 */
export const processVoiceCommand = async (client, userId, transcript) => {
    // Check if this user has voice commands enabled
    const session = activeUsers.get(userId);
    if (!session) return false;

    const text = transcript.toLowerCase().trim();

    for (const [, cmd] of Object.entries(voiceCommands)) {
        for (const keyword of cmd.keywords) {
            if (text.startsWith(keyword)) {
                const args = cmd.hasArgs ? text.slice(keyword.length).trim() : null;
                if (cmd.hasArgs && !args) continue;

                try {
                    await cmd.execute(client, userId, session, args);
                    return true;
                } catch (err) {
                    console.error('[VoiceRecognition] Command error:', err);
                    return false;
                }
            }
        }
    }

    return false;
};

/**
 * Start Voice Recognition for a specific user
 */
export class StartVoiceRecognition {
    constructor() {
        this.name = 'startVoiceRecognition';
    }

    execute = async (client, player, voiceChannel, user) => {
        const userId = user.id;

        if (activeUsers.has(userId)) return;

        const textChannel = client.channels.cache.get(player.textId);
        if (!textChannel) return;

        // Store user session
        activeUsers.set(userId, {
            oderId: userId,
            userName: user.username,
            guildId: player.guildId,
            voiceId: voiceChannel.id,
            textId: player.textId,
            startedAt: Date.now(),
        });

        await textChannel.send({
            embeds: [
                client.embed().desc(
                    `🎤 **Voice Commands Active** for **${user.username}**\n\n` +
                    `Speak these commands:\n` +
                    `• "play <song>"\n` +
                    `• "skip"\n` +
                    `• "stop"\n` +
                    `• "pause" / "resume"\n` +
                    `• "autoplay"\n\n` +
                    `_Only ${user.username}'s voice will be recognized._`
                )
            ],
        });

        client.log(`[VoiceRecognition] Started for user ${user.tag}`, 'info');
    };
}

/**
 * Stop Voice Recognition for a specific user
 */
export class StopVoiceRecognition {
    constructor() {
        this.name = 'stopVoiceRecognition';
    }

    execute = async (client, userId) => {
        const session = activeUsers.get(userId);
        if (!session) return;

        activeUsers.delete(userId);

        const textChannel = client.channels.cache.get(session.textId);
        if (textChannel) {
            await textChannel.send({
                embeds: [client.embed().desc(`�� Voice commands disabled for **${session.userName}**.`)],
            }).catch(() => null);
        }

        client.log(`[VoiceRecognition] Stopped for user ${session.userName}`, 'info');
    };
}

// Check if user has voice recognition active
export const isUserVoiceActive = (userId) => activeUsers.has(userId);

// Get user's voice session
export const getUserVoiceSession = (userId) => activeUsers.get(userId);

// Get all active users
export const getActiveVoiceUsers = () => Array.from(activeUsers.keys());

export default StartVoiceRecognition;
