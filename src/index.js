/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Cluster Manager for multi-shard support
 */

import { config } from 'dotenv';
import { log } from './logger.js';
import { availableParallelism } from 'node:os';
import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load Environment Variables
config();

const mainFile = './nerox.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, mainFile);

const clusterManager = new ClusterManager(file, {
    respawn: true,
    mode: 'process',
    restarts: {
        max: 10,
        interval: 10_000,
    },
    totalShards: 'auto',
    totalClusters: availableParallelism(),
    token: process.env.DISCORD_TOKEN,
});

// Heartbeat Manager for cluster health monitoring
clusterManager.extend(new HeartbeatManager({
    interval: 2000,
    maxMissedHeartbeats: 5,
}));

// Spawn Clusters
clusterManager.spawn({ timeout: -1 });

log("Nerox v4.0.0 starting...", "info");
