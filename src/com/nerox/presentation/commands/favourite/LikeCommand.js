import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class Like extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['addlike'];
        this.description = 'Like the current playing song';
        this.example = ['like'];
        this.inSameVC = true;
        this.execute = async (client, ctx) => {
            const player = client.getPlayer(ctx);
            const current = player?.queue.current;
            if (!current) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} No song is currently playing.`)],
                });
            }

            const liked = (await client.db.liked.get(ctx.author.id)) || [];
            if (liked.some((track) => track.uri === current.uri)) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} This song is already in your liked list.`)],
                });
            }

            liked.push({ title: current.title, uri: current.uri });
            await client.db.liked.set(ctx.author.id, liked);

            return ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Added **${current.title}** to your liked songs.`)],
            });
        };
    }
}
