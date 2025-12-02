/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Toggle Voice Recognition for individual users
 */

import { Command } from '../../framework/abstract/command.js';

export default class VCRequests extends Command {
    constructor() {
        super(...arguments);
        this.name = 'vcrequests';
        this.aliases = ['vcr', 'voicerequests', 'voicecommands'];
        this.description = 'Toggle voice commands for yourself';
        this.usage = '[on|off]';
        this.inSameVC = true;
        this.options = [
            {
                name: 'toggle',
                opType: 'string',
                required: false,
                description: 'Enable or disable voice commands',
                choices: [
                    { name: 'Enable', value: 'on' },
                    { name: 'Disable', value: 'off' },
                ],
            },
        ];

        this.execute = async (client, ctx, args) => {
            const userId = ctx.author.id;
            const guildId = ctx.guild.id;
            const currentStatus = await client.db.vcRequests.get(userId);
            const toggle = args[0]?.toLowerCase();

            // Show current status if no args
            if (!toggle) {
                const status = currentStatus?.enabled ? 'enabled' : 'disabled';

                return await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `**Your Voice Commands** are currently **${status}**.\n\n` +
                                    'When enabled, speak these commands in voice chat:\n' +
                                    '• "play <song>" - Play a song\n' +
                                    '• "skip" - Skip current track\n' +
                                    '• "stop" - Stop playback\n' +
                                    '• "pause" / "resume"\n' +
                                    '• "autoplay" - Toggle autoplay\n\n' +
                                    'Example: Say "play Pal Pal" to play that song.\n\n' +
                                    `Use \`${client.prefix}vcrequests on\` to enable for yourself.`
                            ),
                    ],
                });
            }

            const player = client.getPlayer(ctx);

            // Toggle on
            if (toggle === 'on' || toggle === 'enable') {
                if (!player) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('Start playing music first, then enable voice commands.')],
                    });
                }

                if (currentStatus?.enabled && currentStatus?.guildId === guildId) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('Voice commands is already enabled for you.')],
                    });
                }

                await client.db.vcRequests.set(userId, {
                    enabled: true,
                    userId: userId,
                    guildId: guildId,
                    voiceId: ctx.member.voice.channel.id,
                    textId: ctx.channel.id,
                    enabledAt: Date.now(),
                });

                // Start listening for this user
                client.emit('startVoiceRecognition', player, ctx.member.voice.channel, ctx.author);

                return await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                '🎤 Voice commands enabled **for you**.\n\n' +
                                    'Speak in voice chat to control music:\n' +
                                    '• "play <song name>"\n' +
                                    '• "skip"\n' +
                                    '• "stop"\n' +
                                    '• "pause" / "resume"\n' +
                                    '• "autoplay"\n\n' +
                                    '_Only your voice will be recognized._'
                            ),
                    ],
                });
            }

            // Toggle off
            if (toggle === 'off' || toggle === 'disable') {
                if (!currentStatus?.enabled) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('Voice commands is already disabled for you.')],
                    });
                }

                await client.db.vcRequests.delete(userId);

                // Stop listening for this user
                client.emit('stopVoiceRecognition', userId);

                return await ctx.reply({
                    embeds: [client.embed().desc('🎤 Voice commands disabled for you.')],
                });
            }

            return await ctx.reply({
                embeds: [client.embed().desc('Please specify `on` or `off`.')],
            });
        };
    }
}
