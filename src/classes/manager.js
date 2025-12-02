/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Advanced Music Manager with 3 streaming methods:
 * 1. Lavalink (Primary) - Best quality, requires external server
 * 2. ytdl-core (Backup) - Direct YouTube streaming
 * 3. NeroxPlayer (Custom) - Built-in player system
 */

import apple from 'kazagumo-apple';
import deezer from 'kazagumo-deezer';
import { Connectors } from 'shoukaku';
import spotify from 'kazagumo-spotify';
import { Kazagumo, Plugins } from 'kazagumo';
import { autoplay } from '../functions/autoplay.js';
import { NeroxManager } from '../player/index.js';
import { isLavalinkAvailable, createBackupPlayer, searchTrack, getBackupPlayer } from '../backup/audioSource.js';

// Streaming method enum
export const StreamingMethod = {
    LAVALINK: 'lavalink',
    YTDL: 'ytdl',
    NEROX: 'nerox',
};

/**
 * Advanced Music Manager Class
 * Supports 3 streaming methods with automatic fallback
 */
export class Manager {
    static {
        this.init = (client) => {
            // Check for Lavalink configuration
            const hasLavalink = process.env.LAVALINK_URL && process.env.LAVALINK_AUTH;

            // Determine streaming method
            // Options: 'lavalink', 'nerox', 'auto' (default)
            // 'auto' = Uses Lavalink if configured, falls back to NeroxPlayer
            const streamingMethod = process.env.STREAMING_METHOD || 'auto';
            client.streamingMethod = streamingMethod;

            // Log streaming method decision
            if (streamingMethod === 'nerox') {
                client.log('Streaming method set to NeroxPlayer (forced)', 'info');
            } else if (streamingMethod === 'lavalink' && !hasLavalink) {
                client.log('Lavalink forced but not configured - falling back to NeroxPlayer', 'warn');
            } else if (!hasLavalink) {
                client.log('Lavalink not configured - using NeroxPlayer as primary', 'warn');
            }

            // Validate Spotify config
            if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
                client.log('Spotify credentials missing - Spotify support disabled', 'warn');
            }

            // Initialize NeroxPlayer (Custom wrapper - always available as fallback)
            const neroxManager = new NeroxManager(client);
            client.neroxPlayer = neroxManager;

            // Setup NeroxPlayer events
            neroxManager.on('playerStart', (...args) => client.emit('trackStart', ...args));
            neroxManager.on('playerEnd', async (player) => {
                const playEmbed = player.data.get('playEmbed');
                if (playEmbed) await playEmbed.delete().catch(() => null);
            });
            neroxManager.on('playerEmpty', async (player) => {
                const autoplayEnabled = player.data.get('autoplayStatus');
                if (autoplayEnabled) {
                    await autoplay(client, player);
                } else {
                    player.destroy();
                }
            });
            neroxManager.on('playerDestroy', (...args) => client.emit('playerDestroy', ...args));
            neroxManager.on('playerError', (player, error) => {
                client.log(`NeroxPlayer error: ${error.message}`, 'error');
            });

            // If no Lavalink, use NeroxPlayer as primary
            if (!hasLavalink || streamingMethod === 'nerox') {
                client.log('Using NeroxPlayer as primary streaming method', 'info');
                client.lavalinkReady = false;

                // Return NeroxManager with Kazagumo-compatible interface
                const manager = neroxManager;
                manager.isLavalinkAvailable = () => false;
                manager.useBackup = async (options) => createBackupPlayer(client, options);
                manager.searchBackup = searchTrack;
                manager.getBackupPlayer = getBackupPlayer;
                manager.streamingMethod = StreamingMethod.NEROX;

                return manager;
            }

            // Build Lavalink nodes array
            const lavalinkNodes = [
                {
                    secure: process.env.LAVALINK_SECURE === 'true',
                    auth: process.env.LAVALINK_AUTH,
                    url: process.env.LAVALINK_URL,
                    name: process.env.LAVALINK_NAME || 'nerox-lava',
                },
            ];

            // Build plugins array
            const plugins = [
                new deezer(),
                new apple({
                    imageWidth: 600,
                    imageHeight: 900,
                    countryCode: process.env.APPLE_COUNTRY_CODE || 'us',
                }),
                new Plugins.PlayerMoved(client),
            ];

            // Add Spotify plugin if configured
            if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
                plugins.push(
                    new spotify({
                        searchLimit: 10,
                        albumPageLimit: 1,
                        searchMarket: process.env.SPOTIFY_MARKET || 'IN',
                        playlistPageLimit: 1,
                        clientId: process.env.SPOTIFY_CLIENT_ID,
                        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
                    })
                );
            }

            const manager = new Kazagumo(
                {
                    plugins,
                    defaultSearchEngine: 'youtube',
                    send: (guildId, payload) => client.guilds.cache.get(guildId)?.shard.send(payload),
                },
                new Connectors.DiscordJS(client),
                lavalinkNodes,
                {
                    userAgent: 'NeroxBot/v4.0.0',
                }
            );

            // Player event handlers
            manager.on('playerStuck', async (player) => {
                client.log(`Player stuck in guild ${player.guildId}`, 'warn');
                await player.destroy();
            });

            manager.on('playerException', async (player, error) => {
                client.log(`Player exception: ${error}`, 'error');
                await player.destroy();
            });

            manager.on('playerStart', (...args) => client.emit('trackStart', ...args));
            manager.on('playerDestroy', (...args) => client.emit('playerDestroy', ...args));

            // Shoukaku node events
            manager.shoukaku.on('error', (nodeName, error) => {
                client.log(`Lavalink error on ${nodeName}: ${JSON.stringify(error)}`, 'error');
            });

            manager.shoukaku.on('ready', (name) => {
                client.log(`Lavalink connected: ${name}`, 'success');
                client.lavalinkReady = true;
            });

            manager.shoukaku.on('disconnect', (name, reason) => {
                client.log(`Lavalink disconnected: ${name} - ${reason}`, 'warn');
                client.lavalinkReady = false;
            });

            manager.shoukaku.on('close', (name, code, reason) => {
                client.log(`Lavalink closed: ${name} (${code}) - ${reason}`, 'warn');
                client.lavalinkReady = false;
            });

            // Track end handler
            manager.on('playerEnd', async (player) => {
                const playEmbed = player.data.get('playEmbed');
                if (playEmbed) {
                    await playEmbed.delete().catch(() => null);
                }
            });

            // Queue end handler with autoplay support
            manager.on('playerEmpty', async (player) => {
                const autoplayEnabled = player.data.get('autoplayStatus');
                if (autoplayEnabled) {
                    await autoplay(client, player);
                } else {
                    await player.destroy();
                }
            });

            // Attach helper methods to manager
            manager.isLavalinkAvailable = () => isLavalinkAvailable(client);
            manager.useBackup = async (options) => createBackupPlayer(client, options);
            manager.searchBackup = searchTrack;
            manager.getBackupPlayer = getBackupPlayer;
            manager.neroxPlayer = neroxManager;
            manager.streamingMethod = StreamingMethod.LAVALINK;

            // Fallback method - switch to NeroxPlayer if Lavalink fails
            manager.useFallback = async (options) => {
                client.log('Falling back to NeroxPlayer', 'warn');
                return await neroxManager.createPlayer(options);
            };

            return manager;
        };
    }
}
