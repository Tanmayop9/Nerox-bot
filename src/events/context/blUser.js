/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Blacklist user event handler
 */

import moment from 'moment-timezone';
import { ActionRowBuilder } from 'discord.js';

const event = 'blUser';

export default class BlacklistUser {
    constructor() {
        this.name = event;
        
        this.execute = async (client, ctx) => {
            await client.db.blacklist.set(ctx.author.id, true);

            const replyObject = {
                embeds: [
                    client.embed('#2B2D31')
                        .desc(
                            `You have been blacklisted by the anti-spam system.\n\n` +
                            `If you believe this is an error, please contact support at **${client.config.links.support || 'our support server'}**.`
                        ),
                ],
                components: client.config.links?.support ? [
                    new ActionRowBuilder().addComponents(
                        client.button().link('Support Server', client.config.links.support)
                    ),
                ] : [],
            };

            await ctx.author.send(replyObject).catch(() => null);

            // Log to webhook if available
            if (client.webhooks?.logs) {
                await client.webhooks.logs.send({
                    username: 'Nerox Anti-Spam',
                    avatarURL: client.user?.displayAvatarURL(),
                    embeds: [
                        client.embed()
                            .desc(
                                `User blacklisted at ${moment().tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}\n\n` +
                                `**User:** ${ctx.author.tag} (${ctx.author.id})\n` +
                                `**Server:** ${ctx.guild?.name || 'Unknown'}`
                            ),
                    ],
                }).catch(() => null);
            }
        };
    }
}
