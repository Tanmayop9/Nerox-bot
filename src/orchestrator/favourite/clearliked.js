import { Command } from '../../framework/abstract/command.js';

export default class ClearLiked extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['removelikes', 'clikes'];
        this.description = 'Clear all your liked songs';
        this.example = ['clearliked'];
        this.execute = async (client, ctx) => {
            const data = await client.db.liked.get(ctx.author.id);
            if (!data || !data.length) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} You have no liked songs to clear.`)],
                });
            }

            await client.db.liked.delete(ctx.author.id);

            return ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} All your liked songs have been cleared.`)],
            });
        };
    }
}
