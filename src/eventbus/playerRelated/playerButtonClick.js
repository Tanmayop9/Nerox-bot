import { updatePlayerButtons } from '../../utilities/playerUIUpdater.js';

const event = 'playerButtonClick';

export default class PlayerButtonClick {
    constructor() {
        this.name = event;
        this.execute = async (client, interaction) => {
            const button = interaction.customId.split('_')[2];
            const guildId = interaction.customId.split('_')[1];
            const botVc = interaction.guild?.members.me?.voice.channel;
            const player = client.getPlayer({ guild: { id: guildId } });
            const memberVc = interaction.member?.voice.channel;
            const playEmbedId = player?.data.get('playEmbed')?.id;

            if (!player || interaction.message.id !== playEmbedId) {
                await interaction.message.delete();
                return;
            }

            if (memberVc?.id !== botVc?.id) {
                await interaction.reply({
                    embeds: [
                        client.embed().desc(`${client.emoji.cross} You must be in ${botVc} to be able to do this.`),
                    ],
                    ephemeral: true,
                });
                return;
            }

            const userId = interaction.user.id;
            const current = player?.queue.current;
            player.data.set('userId', userId); // used in updatePlayerButtons

            switch (button) {
                case 'stop':
                    await player.destroy();
                    break;

                case 'pause':
                    player.pause(true);
                    await updatePlayerButtons(client, player);
                    break;

                case 'resume':
                    player.pause(false);
                    await updatePlayerButtons(client, player);
                    break;

                case 'autoplay':
                    player?.data.get('autoplayStatus')
                        ? player?.data.delete('autoplayStatus')
                        : player?.data.set('autoplayStatus', true);
                    await updatePlayerButtons(client, player);
                    break;

                case 'next':
                    if (player.queue.length === 0 && !player.data.get('autoplayStatus')) {
                        await interaction.reply({
                            embeds: [
                                client.embed().desc(`${client.emoji.cross} No more songs left in the queue to skip.`),
                            ],
                            ephemeral: true,
                        });
                        break;
                    }
                    await player.shoukaku.stopTrack();
                    break;

                case 'prev': {
                    const previousTrack = player.queue.previous.pop();
                    if (!previousTrack) {
                        await interaction.reply({
                            embeds: [
                                client.embed().desc(`${client.emoji.cross} There are no previously played song/s.`),
                            ],
                            ephemeral: true,
                        });
                        break;
                    }
                    player.queue.unshift(player.queue.current);
                    player.queue.unshift(previousTrack);
                    await player.shoukaku.stopTrack();
                    player.queue.previous.pop();
                    break;
                }

                case 'like': {
                    if (!current) {
                        await interaction.reply({
                            embeds: [client.embed().desc(`${client.emoji.cross} No song is currently playing.`)],
                            ephemeral: true,
                        });
                        break;
                    }

                    const liked = (await client.db.liked.get(userId)) || [];
                    const index = liked.findIndex((track) => track.uri === current.uri);

                    if (index !== -1) {
                        liked.splice(index, 1);
                        await client.db.liked.set(userId, liked);
                        await interaction.reply({
                            embeds: [
                                client
                                    .embed()
                                    .desc(`${client.emoji.cross} Removed **${current.title}** from your liked songs.`),
                            ],
                            ephemeral: true,
                        });
                    } else {
                        liked.push({ title: current.title, uri: current.uri });
                        await client.db.liked.set(userId, liked);
                        await interaction.reply({
                            embeds: [
                                client
                                    .embed()
                                    .desc(`${client.emoji.check} Added **${current.title}** to your liked songs.`),
                            ],
                            ephemeral: true,
                        });
                    }

                    await updatePlayerButtons(client, player);
                    break;
                }
            }

            if (!interaction.deferred && !interaction.replied) {
                await interaction.deferUpdate();
            }
        };
    }
}
