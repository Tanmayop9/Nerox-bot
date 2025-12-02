import { Command } from '../../classes/abstract/command.js';
export default class Shuffle extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.aliases = ['sh'];
        this.description = 'Shuffle the queue';
        this.execute = async (client, ctx) => {
            client.getPlayer(ctx).queue.shuffle();
            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Shuffled the queue.`)],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
