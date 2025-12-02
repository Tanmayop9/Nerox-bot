import { Command } from '../../../core/client/abstracts/CommandBase.js';

export default class PlayLiked extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['plike', 'likedplay', 'playlikes'];
        this.description = 'Play all your liked songs';
        this.inSameVC = true;
        this.example = ['playliked', 'plike'];
        this.execute = async (client, ctx) => {
            const userId = ctx.author.id;
            const data = await client.db.liked.get(userId);

            if (!data || !data.length) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} You have no liked songs.`)],
                });
            }

            const player =
                client.getPlayer(ctx) ||
                (await client.manager.createPlayer({
                    guildId: ctx.guild.id,
                    textId: ctx.channel.id,
                    voiceId: ctx.member.voice.channel.id,
                    shardId: ctx.guild.shardId,
                    deaf: false,
                }));

            let added = 0;
            for (const track of data) {
                const result = await player.search(track.uri, {
                    requester: ctx.author,
                });
                if (result.tracks.length) {
                    player.queue.add(result.tracks[0]);
                    added++;
                }
            }

            if (!added) {
                return ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Couldn’t load any liked songs.`)],
                });
            }

            if (!player.playing && !player.paused && !player.queue.current) player.play();

            return ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.check} Added **${added}** liked songs to the queue.`)],
            });
        };
    }
}
