/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Message create event handler for prefix commands
 */

export default class MessageCreate {
    constructor() {
        this.name = 'messageCreate';
    }

    execute = async (client, message) => {
        if (!message || message.author?.bot || !message.guild) return;

        // Check for prefix
        const prefix = client.prefix;
        if (!message.content.startsWith(prefix)) return;

        // Parse command and args
        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift()?.toLowerCase();

        // Find command
        const command =
            client.commands.get(commandName) || client.commands.find((cmd) => cmd.aliases?.includes(commandName));

        if (!command) return;

        // Check cooldowns
        const cooldownKey = `${command.name}-${message.author.id}`;
        const cooldownTime = client.cooldowns.get(cooldownKey);

        if (cooldownTime && Date.now() < cooldownTime) {
            const remaining = ((cooldownTime - Date.now()) / 1000).toFixed(1);
            return message.reply({
                embeds: [
                    client.embed('#F23F43').desc(`⏳ Please wait **${remaining}s** before using this command again.`),
                ],
            });
        }

        // Set cooldown
        client.cooldowns.set(cooldownKey, Date.now() + command.cooldown * 1000);
        setTimeout(() => client.cooldowns.delete(cooldownKey), command.cooldown * 1000);

        // Check permissions
        if (command.owner && !client.owners.includes(message.author.id)) {
            return message.reply({
                embeds: [client.embed('#F23F43').desc('❌ This command is restricted to bot owners.')],
            });
        }

        if (command.admin && !client.admins.includes(message.author.id) && !client.owners.includes(message.author.id)) {
            return message.reply({
                embeds: [client.embed('#F23F43').desc('❌ This command is restricted to bot admins.')],
            });
        }

        if (command.userPerms?.length) {
            const missing = command.userPerms.filter((perm) => !message.member.permissions.has(perm));
            if (missing.length) {
                return message.reply({
                    embeds: [
                        client
                            .embed('#F23F43')
                            .desc(`❌ You need the following permissions: \`${missing.join(', ')}\``),
                    ],
                });
            }
        }

        // Create context object
        const ctx = {
            message,
            args,
            guild: message.guild,
            channel: message.channel,
            author: message.author,
            member: message.member,
            reply: (options) => message.reply(options),
            send: (options) => message.channel.send(options),
        };

        // Execute command
        try {
            await command.execute(client, ctx, args);
        } catch (error) {
            client.log(`Command error (${command.name}): ${error.message}`, 'error');
            await message
                .reply({
                    embeds: [client.embed('#F23F43').desc(`❌ An error occurred: ${error.message}`)],
                })
                .catch(() => null);
        }
    };
}
