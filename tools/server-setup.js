#!/usr/bin/env node
/**
 * Nerox Server Setup Tool
 * A standalone Termux-compatible tool to setup Discord support server
 *
 * Usage: node server-setup.js
 *
 * This tool will:
 * - Delete all existing channels (optional)
 * - Create roles with proper permissions
 * - Create categories, text channels, and voice channels
 * - Setup complete server structure for Nerox bot support
 */

import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';
import readline from 'readline-sync';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const log = {
    info: (msg) => console.log(`${colors.cyan}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[!]${colors.reset} ${msg}`),
    step: (msg) => console.log(`${colors.magenta}[>]${colors.reset} ${msg}`),
};

// Banner
console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                               ║
║     ${colors.magenta}███╗   ██╗███████╗██████╗  ██████╗ ██╗  ██╗${colors.cyan}              ║
║     ${colors.magenta}████╗  ██║██╔════╝██╔══██╗██╔═══██╗╚██╗██╔╝${colors.cyan}              ║
║     ${colors.magenta}██╔██╗ ██║█████╗  ██████╔╝██║   ██║ ╚███╔╝${colors.cyan}               ║
║     ${colors.magenta}██║╚██╗██║██╔══╝  ██╔══██╗██║   ██║ ██╔██╗${colors.cyan}               ║
║     ${colors.magenta}██║ ╚████║███████╗██║  ██║╚██████╔╝██╔╝ ██╗${colors.cyan}              ║
║     ${colors.magenta}╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝${colors.cyan}              ║
║                                                               ║
║           ${colors.yellow}Server Setup Tool v1.0.0${colors.cyan}                          ║
║           ${colors.green}Termux Compatible${colors.cyan}                                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Role configurations
const roleConfigs = [
    {
        name: 'Owner',
        color: '#FF0000',
        permissions: [PermissionFlagsBits.Administrator],
        hoist: true,
    },
    {
        name: 'Admin',
        color: '#E74C3C',
        permissions: [PermissionFlagsBits.Administrator],
        hoist: true,
    },
    {
        name: 'Moderator',
        color: '#3498DB',
        permissions: [
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.KickMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.ManageNicknames,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
        ],
        hoist: true,
    },
    {
        name: 'Helper',
        color: '#2ECC71',
        permissions: [
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
        ],
        hoist: true,
    },
    {
        name: 'Member',
        color: '#95A5A6',
        permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.UseVAD,
        ],
        hoist: false,
    },
    {
        name: 'Muted',
        color: '#7F8C8D',
        permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
        hoist: false,
    },
    {
        name: 'Bots',
        color: '#9B59B6',
        permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
        ],
        hoist: true,
    },
];

// Get user input
log.info('Enter your Discord Bot Token:');
const token = readline.question('Token: ', { hideEchoBack: true }).trim();

if (!token) {
    log.error('No token provided. Exiting...');
    process.exit(1);
}

log.info('Enter the Server (Guild) ID to setup:');
const guildId = readline.question('Guild ID: ').trim();

// Validate guild ID format (Discord snowflake: 17-19 digits)
if (!guildId || !/^\d{17,19}$/.test(guildId)) {
    log.error('Invalid Guild ID. Must be a 17-19 digit number. Exiting...');
    process.exit(1);
}

log.warn('Do you want to DELETE all existing channels? (yes/no)');
const deleteChannels = readline.question('Delete channels? ').toLowerCase() === 'yes';

// Create Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Main setup function
async function setupServer(guild) {
    const roles = {};

    // Step 1: Create roles
    log.step('Creating roles...');
    for (const config of roleConfigs) {
        try {
            // Check if role already exists
            let role = guild.roles.cache.find((r) => r.name === config.name);
            if (!role) {
                role = await guild.roles.create({
                    name: config.name,
                    color: config.color,
                    permissions: config.permissions,
                    hoist: config.hoist,
                    reason: 'Nerox Server Setup Tool',
                });
                log.success(`Created role: ${config.name}`);
            } else {
                log.warn(`Role already exists: ${config.name}`);
            }
            roles[config.name.toLowerCase()] = role;
        } catch (error) {
            log.error(`Failed to create role ${config.name}: ${error.message}`);
        }
    }

    // Step 2: Delete existing channels if requested
    if (deleteChannels) {
        log.step('Deleting existing channels...');
        const channels = await guild.channels.fetch();
        const channelArray = [...channels.values()].filter((c) => c !== null);

        // Delete channels in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < channelArray.length; i += batchSize) {
            const batch = channelArray.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch.map((channel) => channel.delete().then(() => channel.name)));

            for (const result of results) {
                if (result.status === 'fulfilled') {
                    log.success(`Deleted channel: ${result.value}`);
                } else {
                    log.error(`Failed to delete channel: ${result.reason?.message || 'Unknown error'}`);
                }
            }
        }
    }

    // Step 3: Create server structure
    log.step('Creating categories and channels...');

    const structure = [
        {
            name: '📢 Information',
            type: ChannelType.GuildCategory,
            channels: [
                { name: 'rules', type: ChannelType.GuildText, topic: 'Server rules and guidelines' },
                { name: 'announcements', type: ChannelType.GuildText, topic: 'Important announcements' },
                { name: 'updates', type: ChannelType.GuildText, topic: 'Bot updates and changelogs' },
                { name: 'faq', type: ChannelType.GuildText, topic: 'Frequently asked questions' },
            ],
            permissions: [
                { id: guild.id, deny: [PermissionFlagsBits.SendMessages] },
                ...(roles.admin ? [{ id: roles.admin.id, allow: [PermissionFlagsBits.SendMessages] }] : []),
                ...(roles.moderator ? [{ id: roles.moderator.id, allow: [PermissionFlagsBits.SendMessages] }] : []),
            ],
        },
        {
            name: '💬 General',
            type: ChannelType.GuildCategory,
            channels: [
                { name: 'general', type: ChannelType.GuildText, topic: 'General chat' },
                { name: 'bot-commands', type: ChannelType.GuildText, topic: 'Use bot commands here' },
                { name: 'media', type: ChannelType.GuildText, topic: 'Share images and videos' },
                { name: 'General Voice', type: ChannelType.GuildVoice },
                { name: 'Music', type: ChannelType.GuildVoice },
                { name: 'Chill Zone', type: ChannelType.GuildVoice },
            ],
            permissions: [
                ...(roles.muted
                    ? [{ id: roles.muted.id, deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.Speak] }]
                    : []),
            ],
        },
        {
            name: '🎫 Support',
            type: ChannelType.GuildCategory,
            channels: [
                { name: 'support-chat', type: ChannelType.GuildText, topic: 'Get help with the bot' },
                { name: 'bug-reports', type: ChannelType.GuildText, topic: 'Report bugs here' },
                { name: 'suggestions', type: ChannelType.GuildText, topic: 'Suggest new features' },
                { name: 'Support Voice', type: ChannelType.GuildVoice },
            ],
            permissions: [...(roles.muted ? [{ id: roles.muted.id, deny: [PermissionFlagsBits.SendMessages] }] : [])],
        },
        {
            name: '🔒 Staff',
            type: ChannelType.GuildCategory,
            channels: [
                { name: 'staff-chat', type: ChannelType.GuildText, topic: 'Staff discussions' },
                { name: 'mod-commands', type: ChannelType.GuildText, topic: 'Moderation commands' },
                { name: 'staff-announcements', type: ChannelType.GuildText, topic: 'Staff announcements' },
                { name: 'Staff Voice', type: ChannelType.GuildVoice },
            ],
            permissions: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                ...(roles.admin ? [{ id: roles.admin.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
                ...(roles.moderator ? [{ id: roles.moderator.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
                ...(roles.helper ? [{ id: roles.helper.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
            ],
        },
        {
            name: '📋 Logs',
            type: ChannelType.GuildCategory,
            channels: [
                { name: 'message-logs', type: ChannelType.GuildText, topic: 'Message edit/delete logs' },
                { name: 'mod-logs', type: ChannelType.GuildText, topic: 'Moderation action logs' },
                { name: 'member-logs', type: ChannelType.GuildText, topic: 'Member join/leave logs' },
                { name: 'server-logs', type: ChannelType.GuildText, topic: 'Server event logs' },
            ],
            permissions: [
                { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                ...(roles.admin ? [{ id: roles.admin.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
                ...(roles.moderator ? [{ id: roles.moderator.id, allow: [PermissionFlagsBits.ViewChannel] }] : []),
                ...(roles.bots
                    ? [
                          {
                              id: roles.bots.id,
                              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                          },
                      ]
                    : []),
            ],
        },
    ];

    for (const category of structure) {
        try {
            // Create category
            const createdCategory = await guild.channels.create({
                name: category.name,
                type: ChannelType.GuildCategory,
                permissionOverwrites: category.permissions,
                reason: 'Nerox Server Setup Tool',
            });
            log.success(`Created category: ${category.name}`);

            // Create channels under category
            for (const channel of category.channels) {
                try {
                    await guild.channels.create({
                        name: channel.name,
                        type: channel.type,
                        parent: createdCategory.id,
                        topic: channel.topic || null,
                        reason: 'Nerox Server Setup Tool',
                    });
                    const channelType = channel.type === ChannelType.GuildVoice ? '🔊' : '💬';
                    log.success(`  ${channelType} Created channel: ${channel.name}`);
                } catch (error) {
                    log.error(`  Failed to create channel ${channel.name}: ${error.message}`);
                }
            }
        } catch (error) {
            log.error(`Failed to create category ${category.name}: ${error.message}`);
        }
    }

    log.success('Server setup complete!');
}

// Client ready event
client.once('ready', async () => {
    log.success(`Logged in as ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(guildId);
        log.info(`Found server: ${guild.name}`);

        console.log('');
        log.warn('Starting server setup in 3 seconds...');
        await new Promise((r) => setTimeout(r, 3000));

        await setupServer(guild);

        console.log(`
${colors.green}╔═══════════════════════════════════════════════════════════╗
║                                                               ║
║              ${colors.cyan}SERVER SETUP COMPLETED!${colors.green}                        ║
║                                                               ║
║   Roles Created:                                              ║
║   • Owner      - Full server control                          ║
║   • Admin      - Administrative permissions                   ║
║   • Moderator  - Moderation permissions                       ║
║   • Helper     - Support assistance                           ║
║   • Member     - Default member role                          ║
║   • Muted      - Restricted permissions                       ║
║   • Bots       - Bot role                                     ║
║                                                               ║
║   Categories Created:                                         ║
║   • 📢 Information                                            ║
║   • 💬 General                                                ║
║   • 🎫 Support                                                ║
║   • 🔒 Staff                                                  ║
║   • 📋 Logs                                                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);
    } catch (error) {
        log.error(`Failed to setup server: ${error.message}`);
    }

    client.destroy();
    process.exit(0);
});

// Login
log.info('Connecting to Discord...');
client.login(token).catch((error) => {
    log.error(`Failed to login: ${error.message}`);
    process.exit(1);
});
