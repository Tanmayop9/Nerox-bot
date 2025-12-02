/**
 * @nerox v1.0.0
 * @author Tanmay
 * @description Advanced Music Manager with multi-platform support
 */

import apple from 'kazagumo-apple';
import deezer from 'kazagumo-deezer';
import { Connectors } from 'shoukaku';
import spotify from 'kazagumo-spotify';
import { Kazagumo, Plugins } from 'kazagumo';
import { autoplay } from '../functions/autoplay.js';

/**
 * Advanced Music Manager Class
 * Handles all music-related operations with multi-platform support
 */
export class Manager {
    static { 
        this.init = (client) => {
            // Validate required environment variables
            const requiredEnvVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'LAVALINK_URL', 'LAVALINK_AUTH'];
            const missingVars = requiredEnvVars.filter(v => !process.env[v]);
            
            if (missingVars.length > 0) {
                client.log(`Warning: Missing environment variables: ${missingVars.join(', ')}`, 'warn');
            }

            const manager = new Kazagumo({
                plugins: [
                    new deezer(),
                    new apple({
                        imageWidth: 600,
                        imageHeight: 900,
                        countryCode: process.env.APPLE_COUNTRY_CODE || 'us',
                    }),
                    new spotify({
                        searchLimit: 10,
                        albumPageLimit: 1,
                        searchMarket: process.env.SPOTIFY_MARKET || 'IN',
                        playlistPageLimit: 1,
                        clientId: process.env.SPOTIFY_CLIENT_ID,
                        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
                    }),
                    new Plugins.PlayerMoved(client),
                ],
                defaultSearchEngine: 'youtube',
                send: (guildId, payload) => client.guilds.cache.get(guildId)?.shard.send(payload),
            }, new Connectors.DiscordJS(client), [
                {
                    secure: process.env.LAVALINK_SECURE === 'true',
                    auth: process.env.LAVALINK_AUTH,
                    url: process.env.LAVALINK_URL,
                    name: process.env.LAVALINK_NAME || 'nerox-lava',
                },
            ], {
                userAgent: `NeroxBot/v1.0.0`,
            });

            // Player event handlers
            manager.on('playerStuck', async (player) => {
                client.log(`Player stuck in guild ${player.guildId}, destroying...`, 'warn');
                await player.destroy();
            });

            manager.on('playerException', async (player, error) => {
                client.log(`Player exception in guild ${player.guildId}: ${error}`, 'error');
                await player.destroy();
            });

            manager.on('playerStart', (...args) => client.emit('trackStart', ...args));
            manager.on('playerDestroy', (...args) => client.emit('playerDestroy', ...args));

            // Shoukaku node events
            manager.shoukaku.on('error', (nodeName, error) => {
                client.log(`Lavalink node ${nodeName} error: ${JSON.stringify(error)}`, 'error');
            });

            manager.shoukaku.on('ready', (name) => {
                client.log(`Lavalink node connected: ${name}`, 'success');
            });

            manager.shoukaku.on('disconnect', (name, reason) => {
                client.log(`Lavalink node disconnected: ${name} - Reason: ${reason}`, 'warn');
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

            return manager;
        }; 
    }
}
