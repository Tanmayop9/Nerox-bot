/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Support bot configuration loaded from environment variables
 */

const parseIds = (envVar) => {
    if (!envVar) return [];
    return envVar
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
};

export const config = {
    // Discord bot token for support bot
    token: process.env.SUPPORT_BOT_TOKEN,

    // Bot owners (full access)
    owners: parseIds(process.env.SUPPORT_BOT_OWNERS),

    // Bot admins (limited admin access)
    admins: parseIds(process.env.SUPPORT_BOT_ADMINS),

    // Default command prefix
    prefix: process.env.SUPPORT_BOT_PREFIX || '!',

    // Support server ID (required)
    supportGuildId: process.env.SUPPORT_GUILD_ID,

    // Ticket settings
    tickets: {
        categoryId: process.env.TICKET_CATEGORY_ID,
        logChannelId: process.env.TICKET_LOG_CHANNEL_ID,
        staffRoleId: process.env.TICKET_STAFF_ROLE_ID,
    },

    // Giveaway settings
    giveaways: {
        channelId: process.env.GIVEAWAY_CHANNEL_ID,
    },

    // Welcome settings
    welcome: {
        channelId: process.env.WELCOME_CHANNEL_ID,
        roleId: process.env.WELCOME_ROLE_ID,
    },

    // Webhook URLs for logging
    webhooks: {
        logs: process.env.SUPPORT_WEBHOOK_LOGS,
        modLogs: process.env.SUPPORT_WEBHOOK_MODLOGS,
    },
};
