/**
 * @nerox v1.0.0
 * @author Tanmay
 * @description Bot configuration with environment variables
 */

export const config = {
    // Bot token from environment
    token: process.env.DISCORD_TOKEN,
    
    // Bot owners and admins (loaded from env or defaults)
    owners: (process.env.BOT_OWNERS || '').split(',').filter(Boolean),
    admins: (process.env.BOT_ADMINS || '').split(',').filter(Boolean),
    
    // Command prefix
    prefix: process.env.BOT_PREFIX || '&',
    
    // Support links
    links: {
        support: process.env.SUPPORT_SERVER || 'https://discord.gg/nerox'
    },
    
    // Backup channel
    backup: process.env.BACKUP_CHANNEL_ID,
    
    // Webhook URLs for logging
    webhooks: {
        logs: process.env.WEBHOOK_LOGS,
        serveradd: process.env.WEBHOOK_SERVERADD,
        serverchuda: process.env.WEBHOOK_SERVERCHUDA,
        playerLogs: process.env.WEBHOOK_PLAYERLOGS
    }
};