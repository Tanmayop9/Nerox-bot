/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Voice Channel text request handler
 * 
 * This handler processes commands typed in voice channel text chats.
 * It listens to 'messageCreate' events alongside the main handler,
 * but only processes messages in GuildVoice channels when vcRequests is enabled.
 */

import { ChannelType } from 'discord.js';
import { updatePlayerButtons } from '../../functions/updatePlayerButtons.js';

const event = 'messageCreate';

// Supported VC commands
const vcCommands = {
    play: async (client, message, args) => {
        if (!args.length) {
            return await message.reply({
                embeds: [client.embed().desc('Please provide a song to play.')],
            });
        }

        const player = client.getPlayer({ guild: message.guild }) ||
            await client.manager.createPlayer({
                deaf: true,
                guildId: message.guild.id,
                textId: message.channel.id,
                shardId: message.guild.shardId,
                voiceId: message.member.voice.channel.id,
            });

        const result = await player.search(args.join(' '), {
            requester: message.author,
        });

        if (!result.tracks.length) {
            return await message.reply({
                embeds: [client.embed().desc('No results found.')],
            });
        }

        const track = result.tracks[0];
        player.queue.add(track);

        if (!player.playing && !player.paused) {
            player.play();
        }

        await message.reply({
            embeds: [client.embed().desc(`Added **${track.title.substring(0, 50)}** to the queue.`)],
        });
    },

    skip: async (client, message) => {
        const player = client.getPlayer({ guild: message.guild });
        if (!player?.queue?.current) {
            return await message.reply({
                embeds: [client.embed().desc('Nothing is playing.')],
            });
        }

        const skipped = player.queue.current;
        await player.shoukaku.stopTrack();

        await message.reply({
            embeds: [client.embed().desc(`Skipped **${skipped.title.substring(0, 40)}**.`)],
        });
    },

    stop: async (client, message) => {
        const player = client.getPlayer({ guild: message.guild });
        if (!player) {
            return await message.reply({
                embeds: [client.embed().desc('Nothing is playing.')],
            });
        }

        // Properly destroy the player before disconnecting
        await player.destroy();

        await message.reply({
            embeds: [client.embed().desc('Stopped playback and disconnected.')],
        });
    },

    pause: async (client, message) => {
        const player = client.getPlayer({ guild: message.guild });
        if (!player?.playing) {
            return await message.reply({
                embeds: [client.embed().desc('Nothing is playing.')],
            });
        }

        player.pause(true);
        await updatePlayerButtons(client, player);

        await message.reply({
            embeds: [client.embed().desc('Paused.')],
        });
    },

    resume: async (client, message) => {
        const player = client.getPlayer({ guild: message.guild });
        if (!player?.paused) {
            return await message.reply({
                embeds: [client.embed().desc('Player is not paused.')],
            });
        }

        player.pause(false);
        await updatePlayerButtons(client, player);

        await message.reply({
            embeds: [client.embed().desc('Resumed.')],
        });
    },

    autoplay: async (client, message) => {
        const player = client.getPlayer({ guild: message.guild });
        if (!player?.queue?.current) {
            return await message.reply({
                embeds: [client.embed().desc('Nothing is playing.')],
            });
        }

        const currentStatus = player.data.get('autoplayStatus') ? true : false;
        currentStatus
            ? player.data.delete('autoplayStatus')
            : player.data.set('autoplayStatus', true);

        await updatePlayerButtons(client, player);

        await message.reply({
            embeds: [client.embed().desc(`Autoplay is now **${!currentStatus ? 'enabled' : 'disabled'}**.`)],
        });
    },
};

export default class VCRequestsHandler {
    constructor() {
        this.name = event;
    }

    execute = async (client, message) => {
        // Ignore bots
        if (message.author.bot) return;

        // Only handle voice channel text (GuildVoice type)
        if (message.channel.type !== ChannelType.GuildVoice) return;

        // Check if VC requests is enabled for this guild
        const vcSettings = await client.db.vcRequests.get(message.guild.id);
        if (!vcSettings?.enabled) return;

        // Check if user is in voice channel
        if (!message.member?.voice?.channel) return;

        // Check if user is in the same VC as the message channel
        if (message.member.voice.channel.id !== message.channel.id) return;

        // Parse message content
        const content = message.content.toLowerCase().trim();
        const args = content.split(/\s+/);
        const command = args.shift();

        // Check if it's a valid VC command
        if (!vcCommands[command]) return;

        try {
            await vcCommands[command](client, message, args);
        } catch (error) {
            console.error(`[VCRequests] Error executing ${command}:`, error);
            await message.reply({
                embeds: [client.embed().desc('An error occurred.')],
            }).catch(() => null);
        }
    };
}
