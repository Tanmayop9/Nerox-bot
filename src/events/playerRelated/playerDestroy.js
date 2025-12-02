/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Player destroy event handler
 */

import { connect247 } from '../../functions/connect247.js';

const event = 'playerDestroy';

export default class PlayerDestroy {
    constructor() {
        this.name = event;
    }

    async execute(client, player) {
        // Update the play embed
        const playEmbed = player.data.get('playEmbed');
        if (playEmbed) {
            await playEmbed.edit({
                embeds: [
                    client.embed().desc(
                        `Playback ended. Thanks for listening!\n\n` +
                        `[Invite Nerox](${client.invite.admin()}) to your other servers.`
                    )
                ],
                components: [],
            }).catch(() => null);
        }

        // Wait before checking 24/7
        await client.sleep(1.5);

        // Reconnect if 24/7 is enabled
        if (await client.db.twoFourSeven.has(player.guildId)) {
            await connect247(client, player.guildId);
        }
    }
}
