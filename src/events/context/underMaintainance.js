/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Maintenance mode handler
 */

const event = 'underMaintenance';

export default class UnderMaintenance {
    constructor() {
        this.name = event;
    }

    execute = async (client, ctx) => {
        await ctx.reply({
            embeds: [
                client.embed().desc(
                    `Nerox is currently under maintenance. We're working to bring it back online as soon as possible.\n\n` +
                    `Join our [support server](${client.config.links?.support || 'https://discord.gg/nerox'}) for updates.`
                )
            ],
        });
    };
}
