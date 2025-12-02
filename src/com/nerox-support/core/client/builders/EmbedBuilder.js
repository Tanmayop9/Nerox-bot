/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Embed Builder for support bot
 */

import { EmbedBuilder } from 'discord.js';

// Color palette
export const Colors = {
    primary: '#2B2D31',
    success: '#23A55A',
    error: '#F23F43',
    warning: '#F0B232',
    info: '#5865F2',
    accent: '#00ADB5',
    ticket: '#3498DB',
    giveaway: '#E91E63',
};

export class ExtendedEmbedBuilder extends EmbedBuilder {
    constructor(color = Colors.primary) {
        super();
        this.setColor(color);
    }

    title(text) {
        return this.setTitle(text);
    }

    desc(text) {
        return this.setDescription(text);
    }

    thumb(url) {
        return url ? this.setThumbnail(url) : this;
    }

    img(url) {
        return url ? this.setImage(url) : this;
    }

    footer(options) {
        return this.setFooter(options);
    }

    // Quick presets
    static success(text) {
        return new ExtendedEmbedBuilder(Colors.success).desc(text);
    }

    static error(text) {
        return new ExtendedEmbedBuilder(Colors.error).desc(text);
    }

    static info(text) {
        return new ExtendedEmbedBuilder(Colors.info).desc(text);
    }

    static warning(text) {
        return new ExtendedEmbedBuilder(Colors.warning).desc(text);
    }

    static ticket(text) {
        return new ExtendedEmbedBuilder(Colors.ticket).desc(text);
    }

    static giveaway(text) {
        return new ExtendedEmbedBuilder(Colors.giveaway).desc(text);
    }
}
