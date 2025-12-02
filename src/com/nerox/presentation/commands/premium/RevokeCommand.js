/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Revoke premium from a user (Owner only)
 */

import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class RevokePremium extends Command {
    constructor() {
        super(...arguments);
        this.name = 'revokepremium';
        this.aliases = ['rp', 'removepremium'];
        this.usage = '<user>';
        this.description = 'Revoke premium from a user';
        this.owner = true;
        this.options = [
            {
                name: 'user',
                required: true,
                opType: 'user',
                description: 'User to revoke premium from',
            },
        ];

        this.execute = async (client, ctx, args) => {
            const target = ctx.mentions.users?.first() || (await client.users.fetch(args[0]).catch(() => null));

            if (!target) {
                return await ctx.reply({
                    embeds: [client.embed().desc('User not found.')],
                });
            }

            const currentPremium = await client.db.premium.get(target.id);

            if (!currentPremium || currentPremium.expiresAt < Date.now()) {
                return await ctx.reply({
                    embeds: [client.embed().desc(`**${target.tag}** does not have active premium.`)],
                });
            }

            await client.db.premium.delete(target.id);

            await ctx.reply({
                embeds: [client.embed().desc(`Revoked premium from **${target.tag}**.`)],
            });

            // Notify the user
            await target
                .send({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                'Your Nerox Premium subscription has been revoked. ' +
                                    'Contact support if you believe this is an error.'
                            ),
                    ],
                })
                .catch(() => null);
        };
    }
}
