import _ from 'lodash';
import { paginator } from '../../toolkit/pageNavigator.js';
import { Command } from '../../framework/abstract/command.js';

export default class ShowLiked extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['liked', 'likes'];
        this.description = 'Show your liked songs';
        this.example = ['showliked'];
        this.execute = async (client, ctx) => {
            const data = await client.db.liked.get(ctx.author.id);

            if (!data || !data.length) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} You have no liked songs.`)],
                });
            }

            const chunks = _.chunk(
                data.map((track, i) => `**${i + 1}.** [${track.title}](${track.uri})`),
                10
            );
            const pages = chunks.map((chunk) => client.embed().desc(chunk.join('\n')));

            await paginator(ctx, pages);
        };
    }
}
