import { ActionRowBuilder, StringSelectMenuBuilder, } from 'discord.js';
import { filter } from '../../utils/filter.js';
import { Command } from '../../classes/abstract/command.js';
export default class Search extends Command {
    constructor() {
        super(...arguments);
        this.inSameVC = true;
        this.aliases = ['sr'];
        this.usage = '<query>';
        this.description = 'Search music using query';
        this.options = [
            {
                name: 'query',
                opType: 'string',
                isAutoComplete: true,
                description: 'what would you like to search ?',
                required: true,
            },
        ];
        this.execute = async (client, ctx, args) => {
            if (!args.length) {
                await ctx.reply({
                    embeds: [client.embed().desc(`${client.emoji.cross} Please provide a query.`)],
                });
                return;
            }
            const player = client.getPlayer(ctx) ||
                (await client.manager.createPlayer({
                    deaf: true,
                    guildId: ctx.guild.id,
                    textId: ctx.channel.id,
                    shardId: ctx.guild.shardId,
                    voiceId: ctx.member.voice.channel.id,
                }));
            const waitEmbed = await ctx.reply({
                embeds: [
                    client
                        .embed()
                        .desc(`${client.emoji.timer} Please wait while I search for relevant tracks.`),
                ],
            });
            const result = {
                youtube: await player
                    .search(args.join(' '), {
                    engine: 'youtube',
                    requester: ctx.author,
                })
                    .then((res) => res.tracks),
                spotify: await player
                    .search(args.join(' '), {
                    engine: 'spotify',
                    requester: ctx.author,
                })
                    .then((res) => res.tracks),
                soundcloud: await player
                    .search(args.join(' '), {
                    engine: 'soundcloud',
                    requester: ctx.author,
                })
                    .then((res) => res.tracks),
            };
            const tracks = [
                ...result.youtube.slice(0, 5),
                ...result.spotify.slice(0, 5),
                ...result.soundcloud.slice(0, 5),
            ];
            if (!tracks.length) {
                await waitEmbed.edit({
                    embeds: [client.embed().desc(`${client.emoji.cross} No results found.`)],
                });
                return;
            }
            const options = tracks.map((track, index) => ({
                label: `${index} -  ${track.title.charAt(0).toUpperCase() + track.title.substring(1, 30)}`,
                value: `${index}`,
                description: `Author: ${track.author.substring(0, 30)}     Duration: ${track?.isStream ? '◉ LiVE' : client.formatDuration(track.length)}`,
                emoji: client.emoji.info,
            }));
            const menu = new StringSelectMenuBuilder()
                .setMinValues(1)
                .setCustomId('menu')
                .addOptions(options)
                .setMaxValues(tracks.length - 1)
                .setPlaceholder('Search results');
            const reply = await waitEmbed.edit({
                embeds: [client.embed().desc(`${client.emoji.info} Select a track below.`)],
                components: [new ActionRowBuilder().addComponents(menu)],
            });
            const collector = reply.createMessageComponentCollector({
                idle: 30000,
                filter: async (interaction) => await filter(interaction, ctx),
            });
            collector.on('collect', async (interaction) => {
                await interaction.deferUpdate();
                const desc = {
                    added: [''],
                    notAdded: [''],
                };
                for (const value of interaction.values) {
                    const song = tracks[parseInt(value)];
                    if (song.length < 10000) {
                        desc.notAdded.push(`${client.emoji.cross} ${song.title}\n`);
                        continue;
                    }
                    player.queue.add(song);
                    desc.added.push(`${client.emoji.check} ${song.title}\n`);
                }
                await reply.edit({
                    embeds: [client.embed().desc(desc.added.join('') + desc.notAdded.join(''))],
                    components: [],
                });
                if (!player.playing && !player.paused)
                    player.play();
            });
            collector.on('end', async (collected) => {
                if (collected.size == 0)
                    await reply.edit({
                        embeds: [client.embed().desc(`${client.emoji.warn} Track selection menu timed out !`)],
                        components: [],
                    });
            });
        };
    }
}
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
