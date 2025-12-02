/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Bot configuration loaded from environment variables
 */

// Parse comma-separated IDs from environment
const parseIds = (envVar) => {
    if (!envVar) return [];
    return envVar.split(',').map(id => id.trim()).filter(Boolean);
};

export const config = {
    // Discord bot token
    token: process.env.DISCORD_TOKEN,
    
    // Bot owners (full access)
    owners: parseIds(process.env.BOT_OWNERS),
    
    // Bot admins (limited admin access)
    admins: parseIds(process.env.BOT_ADMINS),
    
    // Default command prefix
    prefix: process.env.BOT_PREFIX || '&',
    
    // Support server link
    links: {
        support: process.env.SUPPORT_SERVER || 'https://discord.gg/nerox',
    },
    
    // Backup channel for database exports
    backup: process.env.BACKUP_CHANNEL_ID,
    
    // Webhook URLs for logging
    webhooks: {
        logs: process.env.WEBHOOK_LOGS,
        serverAdd: process.env.WEBHOOK_SERVERADD,
        serverRemove: process.env.WEBHOOK_SERVERREMOVE,
        playerLogs: process.env.WEBHOOK_PLAYERLOGS,
    },
};
