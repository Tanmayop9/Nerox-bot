/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Voice Recognition handler for music commands
 * 
 * Note: Full speech-to-text requires external APIs (Google, Wit.ai, Vosk).
 * This implementation provides the framework - connect your preferred
 * speech recognition service in the processAudio function.
 * 
 * For now, this shows the activation message and can be extended
 * with actual speech recognition when an API is configured.
 */

import { updatePlayerButtons } from '../../functions/updatePlayerButtons.js';

// Store active voice command sessions
const activeSessions = new Map();

// Supported voice commands
const voiceCommands = {
    play: {
        keywords: ['play', 'baja', 'chalao'],
        hasArgs: true,
        execute: async (client, guildId, textChannel, args) => {
            const player = client.manager.players.get(guildId);
            if (!player || !args) return;

            const result = await player.search(args, {
                requester: { id: 'voice-command', displayName: 'Voice Command' },
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
        keywords: ['skip', 'next'],
        execute: async (client, guildId, textChannel) => {
            const player = client.manager.players.get(guildId);
            if (!player?.queue?.current) return;

            const skipped = player.queue.current;
            await player.shoukaku.stopTrack();

            await textChannel.send({
                embeds: [client.embed().desc(`🎤 Skipped **${skipped.title.substring(0, 40)}**.`)],
            });
        },
    },

    stop: {
        keywords: ['stop', 'band'],
        execute: async (client, guildId, textChannel) => {
            const player = client.manager.players.get(guildId);
            if (!player) return;

            await player.destroy();

            await textChannel.send({
                embeds: [client.embed().desc('🎤 Stopped playback.')],
            });
        },
    },

    pause: {
        keywords: ['pause', 'ruko'],
        execute: async (client, guildId, textChannel) => {
            const player = client.manager.players.get(guildId);
            if (!player?.playing) return;

            player.pause(true);
            await updatePlayerButtons(client, player);

            await textChannel.send({
                embeds: [client.embed().desc('🎤 Paused.')],
            });
        },
    },

    resume: {
        keywords: ['resume', 'chalu'],
        execute: async (client, guildId, textChannel) => {
            const player = client.manager.players.get(guildId);
            if (!player?.paused) return;

            player.pause(false);
            await updatePlayerButtons(client, player);

            await textChannel.send({
                embeds: [client.embed().desc('🎤 Resumed.')],
            });
        },
    },

    autoplay: {
        keywords: ['autoplay'],
        execute: async (client, guildId, textChannel) => {
            const player = client.manager.players.get(guildId);
            if (!player?.queue?.current) return;

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
 * Process voice command from transcript
 */
export const processVoiceCommand = async (client, guildId, transcript) => {
    const session = activeSessions.get(guildId);
    if (!session) return false;

    const textChannel = client.channels.cache.get(session.textChannelId);
    if (!textChannel) return false;

    const text = transcript.toLowerCase().trim();

    for (const [, cmd] of Object.entries(voiceCommands)) {
        for (const keyword of cmd.keywords) {
            if (text.startsWith(keyword)) {
                const args = cmd.hasArgs ? text.slice(keyword.length).trim() : null;
                if (cmd.hasArgs && !args) continue;

                try {
                    await cmd.execute(client, guildId, textChannel, args);
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
 * Start Voice Recognition
 */
export class StartVoiceRecognition {
    constructor() {
        this.name = 'startVoiceRecognition';
    }

    execute = async (client, player, voiceChannel) => {
        const guildId = player.guildId;

        if (activeSessions.has(guildId)) return;

        const textChannel = client.channels.cache.get(player.textId);
        if (!textChannel) return;

        activeSessions.set(guildId, {
            voiceChannelId: voiceChannel.id,
            textChannelId: player.textId,
            startedAt: Date.now(),
        });

        await textChannel.send({
            embeds: [
                client.embed().desc(
                    `🎤 **Voice Commands Active**\n\n` +
                    `Speak these commands in voice chat:\n` +
                    `• "play <song>"\n` +
                    `• "skip"\n` +
                    `• "stop"\n` +
                    `• "pause" / "resume"\n` +
                    `• "autoplay"\n\n` +
                    `_Note: Voice recognition requires speech-to-text API configuration._`
                )
            ],
        });

        client.log(`[VoiceRecognition] Activated for guild ${guildId}`, 'info');
    };
}

/**
 * Stop Voice Recognition
 */
export class StopVoiceRecognition {
    constructor() {
        this.name = 'stopVoiceRecognition';
    }

    execute = async (client, guildId) => {
        const session = activeSessions.get(guildId);
        if (!session) return;

        activeSessions.delete(guildId);

        const textChannel = client.channels.cache.get(session.textChannelId);
        if (textChannel) {
            await textChannel.send({
                embeds: [client.embed().desc('🎤 Voice Commands disabled.')],
            }).catch(() => null);
        }

        client.log(`[VoiceRecognition] Deactivated for guild ${guildId}`, 'info');
    };
}

// Check if session is active
export const isVoiceRecognitionActive = (guildId) => activeSessions.has(guildId);

// Get session info
export const getVoiceSession = (guildId) => activeSessions.get(guildId);

export default StartVoiceRecognition;
