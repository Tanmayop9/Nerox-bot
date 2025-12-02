/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Toggle Voice Recognition for music commands
 */

import { Command } from '../../classes/abstract/command.js';

export default class VCRequests extends Command {
    constructor() {
        super(...arguments);
        this.name = 'vcrequests';
        this.aliases = ['vcr', 'voicerequests', 'voicecommands'];
        this.description = 'Toggle voice recognition commands';
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
            const guildId = ctx.guild.id;
            const currentStatus = await client.db.vcRequests.get(guildId);
            const toggle = args[0]?.toLowerCase();

            // Show current status if no args
            if (!toggle) {
                const status = currentStatus?.enabled ? 'enabled' : 'disabled';
                const commands = ['play <song>', 'skip', 'stop', 'pause', 'resume', 'autoplay'];
                
                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `**Voice Commands** is currently **${status}** for this server.\n\n` +
                            `When enabled, speak these commands in voice chat:\n` +
                            `${commands.map(c => `• "${c}"`).join('\n')}\n\n` +
                            `Example: Say "play Pal Pal" to play that song.\n\n` +
                            `Use \`${client.prefix}vcrequests on\` to enable.`
                        )
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

                if (currentStatus?.enabled) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('Voice commands is already enabled.')],
                    });
                }

                await client.db.vcRequests.set(guildId, {
                    enabled: true,
                    oderId: ctx.author.id,
                    voiceId: ctx.member.voice.channel.id,
                    enabledAt: Date.now(),
                });

                // Start listening
                client.emit('startVoiceRecognition', player, ctx.member.voice.channel);

                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `Voice commands is now **enabled**.\n\n` +
                            `Speak in voice chat to control music:\n` +
                            `• "play <song name>"\n` +
                            `• "skip"\n` +
                            `• "stop"\n` +
                            `• "pause" / "resume"\n` +
                            `• "autoplay"`
                        )
                    ],
                });
            }

            // Toggle off
            if (toggle === 'off' || toggle === 'disable') {
                if (!currentStatus?.enabled) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('Voice commands is already disabled.')],
                    });
                }

                await client.db.vcRequests.delete(guildId);

                // Stop listening
                client.emit('stopVoiceRecognition', guildId);

                return await ctx.reply({
                    embeds: [client.embed().desc('Voice commands is now **disabled**.')],
                });
            }

            return await ctx.reply({
                embeds: [client.embed().desc('Please specify `on` or `off`.')],
            });
        };
    }
}
