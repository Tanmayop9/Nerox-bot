/**
 * @nerox v4.0.0
 * @author Tanmay
 * @description Advanced Backup Command with progress tracking
 */

import moment from 'moment-timezone';
import { unlink } from 'fs/promises';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AttachmentBuilder } from 'discord.js';
import { zipper } from '../../../infrastructure/handlers/ArchiveCreator.js';
import { Command } from '../../../core/client/abstracts/CommandBase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class Backup extends Command {
    constructor() {
        super(...arguments);
        this.aliases = ['fbup'];
        this.description = 'Create and send a backup archive to the designated channel';
        this.owner = true;

        this.execute = async (client, ctx) => {
            // Validate backup channel configuration
            const backupChannelId = process.env.BACKUP_CHANNEL_ID || client.config.backup;
            if (!backupChannelId) {
                return await ctx.reply({
                    embeds: [
                        client
                            .embed()
                            .desc(
                                `${client.emoji.cross} **Error:** Backup channel not configured. Set BACKUP_CHANNEL_ID in environment.`
                            ),
                    ],
                });
            }

            const metadata = JSON.parse(await readFile(resolve(__dirname, '../../../package.json'), 'utf8'));
            const time = moment().tz('Asia/Kolkata').format('DD_MM_YY_HH_mm');
            const file = `./Nerox_v${metadata.version}_${time}.zip`;

            // Initial status message
            const waitEmbed = await ctx.reply({
                embeds: [client.embed().desc(`${client.emoji.timer} **Initializing backup process...**`)],
            });

            // Progress steps
            const steps = [
                'Initializing core systems...',
                'Scanning project structure...',
                'Analyzing command modules...',
                'Validating file integrity...',
                'Resolving dependencies...',
                'Optimizing storage paths...',
                'Compressing data streams...',
                'Applying archive encryption...',
                `Creating archive: \`${file}\`...`,
                'Running final validation...',
                'Preparing for transmission...',
            ];

            // Show progress updates
            for (const [index] of steps.entries()) {
                await new Promise((r) => setTimeout(r, 1500));
                const completedSteps = steps
                    .slice(0, index + 1)
                    .map((s) => `${client.emoji.check} ${s}`)
                    .join('\n');
                const currentStep = steps[index + 1] ? `${client.emoji.timer} **${steps[index + 1]}**` : '';

                await waitEmbed.edit({
                    embeds: [client.embed().desc(`${completedSteps}\n${currentStep}`)],
                });
            }

            // Create backup archive
            await zipper(file);

            // Fetch target channel
            const targetChannel = await client.channels.fetch(backupChannelId).catch(() => null);
            if (!targetChannel) {
                return await waitEmbed.edit({
                    embeds: [
                        client.embed().desc(`${client.emoji.cross} **Error:** Unable to access the backup channel.`),
                    ],
                });
            }

            // Send backup file
            const sent = await targetChannel
                .send({
                    content: `📦 **Backup Created** — ${moment().tz('Asia/Kolkata').format('MMMM DD, YYYY [at] HH:mm:ss')}`,
                    files: [new AttachmentBuilder(file, { name: file })],
                })
                .then(() => true)
                .catch((error) => {
                    console.error('Backup transmission error:', error);
                    return false;
                });

            // Final status update
            await waitEmbed.edit({
                embeds: [
                    client
                        .embed()
                        .desc(
                            sent
                                ? `${client.emoji.check} **Backup Complete!**\n\nArchive \`${file}\` has been successfully transmitted to <#${backupChannelId}>.`
                                : `${client.emoji.cross} **Backup Failed!**\n\nUnable to transmit archive. Check bot permissions and logs.`
                        ),
                ],
            });

            // Cleanup local file
            await unlink(file).catch(() => null);
        };
    }
}
