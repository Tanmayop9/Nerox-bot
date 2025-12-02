import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SlashCommandBuilder, REST } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export const deploySlashCommands = async (client) => {
    const slashCommands = [];
    const rest = new REST().setToken(client.config.token);
    for (const category of await readdir(resolve(__dirname, '../commands'))) {
        for (const file of await readdir(resolve(__dirname, '../commands', category))) {
            if (!file.endsWith('.js'))
                continue;
            const command = new (await import(pathToFileURL(resolve(__dirname, '../commands', category, file)).href)).default();
            if (!command.slash)
                continue;
            const slashCommand = new SlashCommandBuilder()
                .setName(file.split('.')[0].toLowerCase())
                .setDescription(command.description);
            if (!command.options.length) {
                slashCommands.push(slashCommand);
                continue;
            }
            for (const op of command.options) {
                if (op.opType === 'string') {
                    slashCommand.addStringOption((option) => {
                        option
                            .setName(op.name)
                            .setDescription(op.description)
                            .setRequired(op.required)
                            .setAutocomplete(op.isAutoComplete || false);
                        if (op.choices)
                            option.addChoices(...op.choices);
                        return option;
                    });
                    continue;
                }
                slashCommand[{
                    user: 'addUserOption',
                    role: 'addRoleOption',
                    number: 'addNumberOption',
                    boolean: 'addBooleanOption',
                    channel: 'addChannelOption',
                    attachment: 'addAttachmentOption',
                }[op.opType]
                //@ts-expect-error no errs tbh
                ]((option) => {
                    option.setName(op.name).setDescription(op.description).setRequired(op.required);
                    return option;
                });
            }
            slashCommands.push(slashCommand);
        }
    }
    await rest.put(`/applications/${client.user.id}/commands`, {
        body: slashCommands,
    });
    client.log(`Loaded ${slashCommands.length} slash commands`, 'success');
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */
