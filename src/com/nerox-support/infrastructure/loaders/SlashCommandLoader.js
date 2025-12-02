/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Slash command loader and deployer for support bot
 */

import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const deploySlashCommands = async (client) => {
    const slashCommands = [];
    const rest = new REST().setToken(client.config.token);

    for (const category of await readdir(resolve(__dirname, '../../presentation/commands'))) {
        for (const file of await readdir(resolve(__dirname, '../../presentation/commands', category))) {
            if (!file.endsWith('.js')) continue;

            const command = new (
                await import(pathToFileURL(resolve(__dirname, '../../presentation/commands', category, file)).href)
            ).default();

            if (!command.slash) continue;

            // Extract command name from PascalCase file name (e.g., TicketCommand.js -> ticket)
            const slashCommand = new SlashCommandBuilder()
                .setName(file.replace('Command.js', '').toLowerCase())
                .setDescription(command.description);

            if (!command.options?.length) {
                slashCommands.push(slashCommand);
                continue;
            }

            for (const op of command.options) {
                if (op.opType === 'string') {
                    slashCommand.addStringOption((option) => {
                        option
                            .setName(op.name)
                            .setDescription(op.description)
                            .setRequired(op.required || false);
                        if (op.choices) option.addChoices(...op.choices);
                        return option;
                    });
                    continue;
                }

                if (op.opType === 'subcommand') {
                    slashCommand.addSubcommand((sub) => {
                        sub.setName(op.name).setDescription(op.description);
                        if (op.options) {
                            for (const subOp of op.options) {
                                if (subOp.opType === 'string') {
                                    sub.addStringOption((opt) =>
                                        opt
                                            .setName(subOp.name)
                                            .setDescription(subOp.description)
                                            .setRequired(subOp.required || false)
                                    );
                                } else if (subOp.opType === 'user') {
                                    sub.addUserOption((opt) =>
                                        opt
                                            .setName(subOp.name)
                                            .setDescription(subOp.description)
                                            .setRequired(subOp.required || false)
                                    );
                                } else if (subOp.opType === 'number') {
                                    sub.addNumberOption((opt) =>
                                        opt
                                            .setName(subOp.name)
                                            .setDescription(subOp.description)
                                            .setRequired(subOp.required || false)
                                    );
                                } else if (subOp.opType === 'channel') {
                                    sub.addChannelOption((opt) =>
                                        opt
                                            .setName(subOp.name)
                                            .setDescription(subOp.description)
                                            .setRequired(subOp.required || false)
                                    );
                                } else if (subOp.opType === 'role') {
                                    sub.addRoleOption((opt) =>
                                        opt
                                            .setName(subOp.name)
                                            .setDescription(subOp.description)
                                            .setRequired(subOp.required || false)
                                    );
                                }
                            }
                        }
                        return sub;
                    });
                    continue;
                }

                const methodMap = {
                    user: 'addUserOption',
                    role: 'addRoleOption',
                    number: 'addNumberOption',
                    boolean: 'addBooleanOption',
                    channel: 'addChannelOption',
                    attachment: 'addAttachmentOption',
                };

                if (methodMap[op.opType]) {
                    slashCommand[methodMap[op.opType]]((option) => {
                        option
                            .setName(op.name)
                            .setDescription(op.description)
                            .setRequired(op.required || false);
                        return option;
                    });
                }
            }

            slashCommands.push(slashCommand);
        }
    }

    // Deploy globally
    await rest.put(Routes.applicationCommands(client.user.id), {
        body: slashCommands,
    });

    client.log(`Deployed ${slashCommands.length} slash commands`, 'success');
};
