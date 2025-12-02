/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Complete Voice Recognition System using Wit.ai
 *
 * Captures user audio from Discord VC and processes speech-to-text
 * for music commands. Supports Hindi + English.
 *
 * Setup: Get free API key from https://wit.ai
 * Add WIT_AI_TOKEN to your .env file
 */

import { EndBehaviorType, getVoiceConnection } from '@discordjs/voice';
import prism from 'prism-media';
import https from 'https';
import { updatePlayerButtons } from '../../../services/PlayerUIUpdaterService.js';

// Active voice sessions per user
const activeUsers = new Map();

/**
 * Voice Commands Configuration
 */
const voiceCommands = {
    play: {
        keywords: ['play', 'baja', 'chalao', 'laga', 'bajao', 'lagao'],
        hasArgs: true,
        execute: async (client, userId, session, args) => {
            const player = client.manager.players.get(session.guildId);
            if (!player || !args) return;

            const textChannel = client.channels.cache.get(session.textId);
            if (!textChannel) return;

            try {
                const result = await player.search(args, {
                    requester: { id: userId, tag: 'Voice' },
                });

                if (!result.tracks.length) {
                    return textChannel
                        .send({
                            embeds: [client.embed().desc(`🎤 "${args}" not found.`)],
                        })
                        .catch(() => {});
                }

                const track = result.tracks[0];
                player.queue.add(track);

                if (!player.playing && !player.paused) player.play();

                textChannel
                    .send({
                        embeds: [client.embed().desc(`🎤 Added **${track.title.substring(0, 40)}**`)],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Play error:', err.message);
            }
        },
    },

    skip: {
        keywords: ['skip', 'next', 'agla', 'skip karo'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.queue?.current) return;

            const textChannel = client.channels.cache.get(session.textId);
            const title = player.queue.current.title?.substring(0, 30) || 'track';

            try {
                await player.shoukaku.stopTrack();
                textChannel
                    ?.send({
                        embeds: [client.embed().desc(`🎤 Skipped **${title}**`)],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Skip error:', err.message);
            }
        },
    },

    stop: {
        keywords: ['stop', 'band', 'ruko', 'band karo', 'hatao'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player) return;

            const textChannel = client.channels.cache.get(session.textId);

            try {
                await player.destroy();
                textChannel
                    ?.send({
                        embeds: [client.embed().desc('�� Stopped.')],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Stop error:', err.message);
            }
        },
    },

    pause: {
        keywords: ['pause', 'roko', 'rok do', 'pause karo'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.playing || player.paused) return;

            const textChannel = client.channels.cache.get(session.textId);

            try {
                player.pause(true);
                await updatePlayerButtons(client, player);
                textChannel
                    ?.send({
                        embeds: [client.embed().desc('🎤 Paused.')],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Pause error:', err.message);
            }
        },
    },

    resume: {
        keywords: ['resume', 'chalu', 'start', 'chalu karo', 'shuru karo'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.paused) return;

            const textChannel = client.channels.cache.get(session.textId);

            try {
                player.pause(false);
                await updatePlayerButtons(client, player);
                textChannel
                    ?.send({
                        embeds: [client.embed().desc('🎤 Resumed.')],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Resume error:', err.message);
            }
        },
    },

    autoplay: {
        keywords: ['autoplay', 'auto', 'automatic'],
        execute: async (client, userId, session) => {
            const player = client.manager.players.get(session.guildId);
            if (!player?.queue?.current) return;

            const textChannel = client.channels.cache.get(session.textId);
            const status = player.data.get('autoplayStatus');

            status ? player.data.delete('autoplayStatus') : player.data.set('autoplayStatus', true);

            try {
                await updatePlayerButtons(client, player);
                textChannel
                    ?.send({
                        embeds: [client.embed().desc(`🎤 Autoplay ${!status ? 'on' : 'off'}.`)],
                    })
                    .catch(() => {});
            } catch (err) {
                console.error('[VoiceCmd] Autoplay error:', err.message);
            }
        },
    },
};

/**
 * Send audio to Wit.ai for speech recognition
 */
const recognizeSpeech = (audioBuffer) => {
    return new Promise((resolve) => {
        const token = process.env.WIT_AI_TOKEN;
        if (!token) return resolve(null);

        const options = {
            hostname: 'api.wit.ai',
            path: '/speech?v=20230215',
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'audio/raw;encoding=signed-integer;bits=16;rate=48000;endian=little',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.text || null);
                } catch {
                    resolve(null);
                }
            });
        });

        req.on('error', () => resolve(null));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve(null);
        });
        req.write(audioBuffer);
        req.end();
    });
};

/**
 * Process recognized text and execute commands
 */
const processCommand = async (client, userId, transcript) => {
    const session = activeUsers.get(userId);
    if (!session) return;

    const text = transcript.toLowerCase().trim();
    console.log(`[Voice] ${userId}: "${text}"`);

    for (const [, cmd] of Object.entries(voiceCommands)) {
        for (const keyword of cmd.keywords) {
            if (text.includes(keyword)) {
                const args = cmd.hasArgs ? text.replace(new RegExp(`.*${keyword}\\s*`, 'i'), '').trim() : null;
                if (cmd.hasArgs && (!args || args.length < 2)) continue;

                try {
                    await cmd.execute(client, userId, session, args);
                    return;
                } catch (err) {
                    console.error('[Voice] Command error:', err.message);
                }
            }
        }
    }
};

/**
 * Start listening to user audio
 */
const startListening = (client, guildId, userId, _session) => {
    const connection = getVoiceConnection(guildId);
    if (!connection) return;

    const receiver = connection.receiver;

    receiver.speaking.on('start', (speakingUserId) => {
        // Only listen to the user who enabled voice commands
        if (speakingUserId !== userId) return;
        if (!activeUsers.has(userId)) return;

        const audioStream = receiver.subscribe(speakingUserId, {
            end: { behavior: EndBehaviorType.AfterSilence, duration: 1500 },
        });

        const decoder = new prism.opus.Decoder({
            rate: 48000,
            channels: 1,
            frameSize: 960,
        });
        const chunks = [];

        audioStream.pipe(decoder);

        decoder.on('data', (chunk) => chunks.push(chunk));

        decoder.on('end', async () => {
            if (chunks.length === 0) return;

            const buffer = Buffer.concat(chunks);
            // Min 0.5 second of audio
            if (buffer.length < 48000) return;

            const transcript = await recognizeSpeech(buffer);
            if (transcript && transcript.length > 1) {
                await processCommand(client, userId, transcript);
            }
        });

        decoder.on('error', () => {});
        audioStream.on('error', () => {});
    });
};

/**
 * Start Voice Recognition Event
 */
export class StartVoiceRecognition {
    constructor() {
        this.name = 'startVoiceRecognition';
    }

    execute = async (client, player, voiceChannel, user) => {
        const userId = user.id;
        const guildId = player.guildId;

        if (activeUsers.has(userId)) return;

        const textChannel = client.channels.cache.get(player.textId);
        if (!textChannel) return;

        // Check Wit.ai token
        if (!process.env.WIT_AI_TOKEN) {
            return textChannel.send({
                embeds: [
                    client
                        .embed()
                        .desc(
                            '🎤 **Voice Commands Setup**\n\n' +
                                '1. Go to [wit.ai](https://wit.ai) (free)\n' +
                                '2. Create app → Settings → Server Access Token\n' +
                                '3. Add `WIT_AI_TOKEN=your_token` to .env\n' +
                                '4. Restart bot\n\n' +
                                '_Supports Hindi + English!_'
                        ),
                ],
            });
        }

        // Store session
        activeUsers.set(userId, {
            userId: userId,
            userName: user.username,
            guildId: guildId,
            voiceId: voiceChannel.id,
            textId: player.textId,
        });

        // Start listening
        startListening(client, guildId, userId, activeUsers.get(userId));

        await textChannel.send({
            embeds: [
                client
                    .embed()
                    .desc(
                        `🎤 **Voice Commands ON** for **${user.username}**\n\n` +
                            'Say these commands:\n' +
                            '• "play <song>"\n' +
                            '• "skip" / "next"\n' +
                            '• "stop" / "band karo"\n' +
                            '• "pause" / "resume"\n' +
                            '• "autoplay"\n\n' +
                            '_Hindi bhi chalega!_'
                    ),
            ],
        });

        client.log(`[Voice] Started for ${user.tag}`, 'success');
    };
}

/**
 * Stop Voice Recognition Event
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
        textChannel
            ?.send({
                embeds: [client.embed().desc(`🎤 Voice commands OFF for **${session.userName}**.`)],
            })
            .catch(() => {});

        client.log(`[Voice] Stopped for ${session.userName}`, 'info');
    };
}

// Exports
export const isUserVoiceActive = (userId) => activeUsers.has(userId);
export const getUserSession = (userId) => activeUsers.get(userId);
export default StartVoiceRecognition;
