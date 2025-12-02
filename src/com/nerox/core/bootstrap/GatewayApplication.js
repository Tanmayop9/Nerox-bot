/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Cluster Manager for multi-shard support with rate limit handling
 */

import { config } from 'dotenv';
import { log } from '../logging/LoggerService.js';
import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load Environment Variables
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const mainFile = './EngineRunner.js';
const file = resolve(__dirname, mainFile);

// Validate token
if (!process.env.DISCORD_TOKEN) {
    console.error('ERROR: DISCORD_TOKEN is not set in environment variables!');
    process.exit(1);
}

const clusterManager = new ClusterManager(file, {
    respawn: true,
    mode: 'process',
    restarts: {
        max: 5,
        interval: 60_000, // Increased interval to avoid rate limits
    },
    totalShards: 1, // Use fixed shard count to avoid API calls, change as needed
    totalClusters: 1, // Use fixed cluster count
    token: process.env.DISCORD_TOKEN,
});

// Heartbeat Manager for cluster health monitoring
clusterManager.extend(
    new HeartbeatManager({
        interval: 5000,
        maxMissedHeartbeats: 5,
    })
);

// Event handlers
clusterManager.on('clusterCreate', (cluster) => {
    log(`Cluster ${cluster.id} created`, 'info');

    cluster.on('death', () => {
        log(`Cluster ${cluster.id} died, respawning...`, 'warn');
    });

    cluster.on('error', (error) => {
        log(`Cluster ${cluster.id} error: ${error.message}`, 'error');
    });
});

// Spawn with delay to avoid rate limits
const spawnClusters = async () => {
    try {
        log('Nerox v4.0.0 starting...', 'info');
        await clusterManager.spawn({
            timeout: -1,
            delay: 7000, // 7 second delay between cluster spawns
        });
    } catch (error) {
        if (error.message.includes('429')) {
            log('Rate limited by Discord. Waiting 60 seconds before retry...', 'warn');
            await new Promise((r) => setTimeout(r, 60000));
            spawnClusters();
        } else {
            log(`Failed to spawn clusters: ${error.message}`, 'error');
            console.error(error);
        }
    }
};

spawnClusters();
