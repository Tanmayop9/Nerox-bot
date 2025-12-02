/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Advanced Music Manager with Lavalink + Backup fallback support
 */

import apple from 'kazagumo-apple';
import deezer from 'kazagumo-deezer';
import { Connectors } from 'shoukaku';
import spotify from 'kazagumo-spotify';
import { Kazagumo, Plugins } from 'kazagumo';
import { autoplay } from '../functions/autoplay.js';
import { isLavalinkAvailable, createBackupPlayer, searchTrack, getBackupPlayer } from '../backup/audioSource.js';

/**
 * Advanced Music Manager Class
 * Primary: Lavalink via Kazagumo/Shoukaku
 * Fallback: play-dl direct streaming
 */
export class Manager {
    static { 
        this.init = (client) => {
            // Check for Lavalink configuration
            const hasLavalink = process.env.LAVALINK_URL && process.env.LAVALINK_AUTH;
            
            if (!hasLavalink) {
                client.log('Lavalink not configured - will use backup audio source', 'warn');
            }

            // Validate Spotify config
            if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
                client.log('Spotify credentials missing - Spotify support disabled', 'warn');
            }

            // Build Lavalink nodes array
            const lavalinkNodes = hasLavalink ? [{
                secure: process.env.LAVALINK_SECURE === 'true',
                auth: process.env.LAVALINK_AUTH,
                url: process.env.LAVALINK_URL,
                name: process.env.LAVALINK_NAME || 'nerox-lava',
            }] : [];

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
                plugins.push(new spotify({
                    searchLimit: 10,
                    albumPageLimit: 1,
                    searchMarket: process.env.SPOTIFY_MARKET || 'IN',
                    playlistPageLimit: 1,
                    clientId: process.env.SPOTIFY_CLIENT_ID,
                    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
                }));
            }

            const manager = new Kazagumo({
                plugins,
                defaultSearchEngine: 'youtube',
                send: (guildId, payload) => client.guilds.cache.get(guildId)?.shard.send(payload),
            }, new Connectors.DiscordJS(client), lavalinkNodes, {
                userAgent: 'NeroxBot/v4.0.0',
            });

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

            return manager;
        }; 
    }
}
