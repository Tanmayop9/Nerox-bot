/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Command help/guide handler
 */

const event = 'infoRequested';

export default class InfoRequested {
    constructor() {
        this.name = event;
    }

    execute = async (client, ctx, command) => {
        const prefix = await client.db.prefix.get(ctx.guild?.id) || client.prefix;
        
        const aliases = command.aliases?.length 
            ? command.aliases.join(', ') 
            : 'None';
            
        const usage = command.usage 
            ? `${prefix}${command.name} ${command.usage}` 
            : `${prefix}${command.name}`;

        const cooldown = command.cooldown 
            ? `${command.cooldown} seconds` 
            : 'None';

        await ctx.reply({
            embeds: [
                client.embed()
                    .title(`Command: ${command.name}`)
                    .desc(
                        `${command.description || 'No description available.'}\n\n` +
                        `**Usage:** \`${usage}\`\n` +
                        `**Aliases:** \`${aliases}\`\n` +
                        `**Cooldown:** \`${cooldown}\``
                    )
                    .footer({ text: '<required> [optional]' })
            ],
        });
    };
}
