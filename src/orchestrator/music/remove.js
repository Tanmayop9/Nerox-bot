import { Command } from '../../framework/abstract/command.js';
export default class Remove extends Command {
    constructor() {
        super(...arguments);
        this.playing = true;
        this.inSameVC = true;
        this.usage = '<position>';
        this.description = 'Remove song from queue';
        this.options = [
            {
                required: true,
                opType: 'string',
                name: 'position',
                description: 'which song to remove',
            },
        ];
        this.execute = async (client, ctx, args) => {
            const player = client.getPlayer(ctx);
            const position = Number(args[0]) - ((player?.queue.previous.length || 0) + 1);
            const track = player.queue[position];
            if (position > player.queue.length || !track) {
                await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No song in queue at postion ${position + 1}.`)],
                });
                return;
            }
            player.queue.splice(position, 1);
            await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Removed ${track.title}.`)],
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
