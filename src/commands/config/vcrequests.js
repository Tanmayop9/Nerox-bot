/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Toggle Voice Channel text requests
 */

import { Command } from '../../classes/abstract/command.js';

export default class VCRequests extends Command {
    constructor() {
        super(...arguments);
        this.name = 'vcrequests';
        this.aliases = ['vcr', 'voicerequests', 'vctext'];
        this.description = 'Toggle voice channel text commands';
        this.usage = '[on|off]';
        this.userPerms = ['ManageGuild'];
        this.options = [
            {
                name: 'toggle',
                opType: 'string',
                required: false,
                description: 'Enable or disable VC requests',
                choices: [
                    { name: 'Enable', value: 'on' },
                    { name: 'Disable', value: 'off' },
                ],
            },
        ];

        this.execute = async (client, ctx, args) => {
            const currentStatus = await client.db.vcRequests.get(ctx.guild.id);
            const toggle = args[0]?.toLowerCase();

            // Show current status if no args
            if (!toggle) {
                const status = currentStatus?.enabled ? 'enabled' : 'disabled';
                const commands = ['play', 'skip', 'stop', 'pause', 'resume', 'autoplay'];
                
                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `**VC Requests** is currently **${status}** for this server.\n\n` +
                            `When enabled, users can type commands directly in the voice channel text chat:\n` +
                            `${commands.map(c => `\`${c}\``).join(', ')}\n\n` +
                            `Use \`${client.prefix}vcrequests on\` or \`${client.prefix}vcrequests off\` to toggle.`
                        )
                    ],
                });
            }

            // Toggle on
            if (toggle === 'on' || toggle === 'enable') {
                if (currentStatus?.enabled) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('VC Requests is already enabled.')],
                    });
                }

                await client.db.vcRequests.set(ctx.guild.id, {
                    enabled: true,
                    enabledBy: ctx.author.id,
                    enabledAt: Date.now(),
                });

                return await ctx.reply({
                    embeds: [
                        client.embed().desc(
                            `VC Requests is now **enabled**.\n\n` +
                            `Users can now type \`play <song>\`, \`skip\`, \`stop\`, \`pause\`, \`resume\`, or \`autoplay\` ` +
                            `directly in the voice channel text chat.`
                        )
                    ],
                });
            }

            // Toggle off
            if (toggle === 'off' || toggle === 'disable') {
                if (!currentStatus?.enabled) {
                    return await ctx.reply({
                        embeds: [client.embed().desc('VC Requests is already disabled.')],
                    });
                }

                await client.db.vcRequests.delete(ctx.guild.id);

                return await ctx.reply({
                    embeds: [client.embed().desc('VC Requests is now **disabled**.')],
                });
            }

            return await ctx.reply({
                embeds: [client.embed().desc('Please specify `on` or `off`.')],
            });
        };
    }
}
