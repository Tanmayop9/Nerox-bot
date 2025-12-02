const event = 'infoRequested';
export default class InfoRequested {
    constructor() {
        this.name = event;
        this.execute = async (client, ctx, command) => {
            const aliases = command.aliases?.length ? command.aliases.join(', ') : 'No aliases found';
            const examples = command.example?.length
                ? command.example.map((ex, i, arr) =>
                    `ㅤㅤ${i === arr.length - 1 ? '└' : '├'} \`${client.prefix}${ex}\``
                  ).join('\n')
                : 'No example found';

            const userPerms = command.userPerms?.length
                ? command.userPerms.map((p, i, arr) => `ㅤㅤ${i === arr.length - 1 ? '└' : '├'} \`${p}\``).join('\n')
                : 'ㅤㅤ└ \`None\`';

            const botPerms = command.botPerms?.length
                ? command.botPerms.map((p, i, arr) => `ㅤㅤ${i === arr.length - 1 ? '└' : '├'} \`${p}\``).join('\n')
                : 'ㅤㅤ└ \`None\`';

            await ctx.reply({
                embeds: [
                    client.embed().title(  `__**${command.name.charAt(0).toUpperCase() + command.name.slice(1)} Help Menu**__\n`)
                        .setDescription(
                         `**${client.emoji.info1} Information for the command "${command.name}**"\n` +
                            `⠀⠀- ${command.description}\n\n` +

                            `${client.emoji.info} **Cooldown:** \`${command.cooldown || 'No cooldown'}\`\n` +
                            `${client.emoji.info} **Aliases:** \`${aliases}\`\n` +
                            `${client.emoji.info} **Usage:** \`${client.prefix}${command.name} ${command.usage || ''}\`\n\n` +

                            `${client.emoji.info} **Example/s:**\n${examples}\n\n` +

                            `${client.emoji.check} **Required Bot permission/s:**\n${botPerms}\n\n` +
                            `${client.emoji.check} **Required User permission/s:**\n${userPerms}`
                        ),
                ],
            });
        };
    }
}