/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Interaction handler for slash commands and button interactions
 */

export default class InteractionCreate {
    constructor() {
        this.name = 'interactionCreate';
    }

    execute = async (client, interaction) => {
        if (!interaction || interaction.user?.bot) return;

        // Button interactions
        if (interaction.isButton()) {
            return void client.emit('buttonClick', interaction);
        }

        // Slash Commands
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Check permissions
            if (command.owner && !client.owners.includes(interaction.user.id)) {
                return interaction.reply({
                    embeds: [client.embed('#F23F43').desc('❌ This command is restricted to bot owners.')],
                    ephemeral: true,
                });
            }

            if (
                command.admin &&
                !client.admins.includes(interaction.user.id) &&
                !client.owners.includes(interaction.user.id)
            ) {
                return interaction.reply({
                    embeds: [client.embed('#F23F43').desc('❌ This command is restricted to bot admins.')],
                    ephemeral: true,
                });
            }

            // Create context object
            const ctx = {
                interaction,
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                member: interaction.member,
                reply: (options) => {
                    if (interaction.deferred || interaction.replied) {
                        return interaction.editReply(options);
                    }
                    return interaction.reply(options);
                },
                send: (options) => interaction.channel.send(options),
                defer: () => interaction.deferReply(),
                getOption: (name) => interaction.options.get(name)?.value,
                getSubcommand: () => {
                    try {
                        return interaction.options.getSubcommand();
                    } catch {
                        return null;
                    }
                },
            };

            // Get args from options
            const args = [];
            if (interaction.options.data) {
                for (const option of interaction.options.data) {
                    if (option.value !== undefined) {
                        args.push(String(option.value));
                    }
                }
            }

            // Execute command
            try {
                await command.execute(client, ctx, args);
            } catch (error) {
                client.log(`Slash command error (${command.name}): ${error.message}`, 'error');
                const errorEmbed = client.embed('#F23F43').desc(`❌ An error occurred: ${error.message}`);

                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ embeds: [errorEmbed] }).catch(() => null);
                } else {
                    await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => null);
                }
            }
        }
    };
}
