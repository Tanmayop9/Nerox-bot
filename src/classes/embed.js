/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Embed Builder with minimalist design system
 */

import { EmbedBuilder } from 'discord.js';

// Minimalist color palette
export const Colors = {
    primary: '#2B2D31',    // Discord dark
    success: '#23A55A',    // Green
    error: '#F23F43',      // Red
    warning: '#F0B232',    // Yellow
    info: '#5865F2',       // Blurple
    accent: '#00ADB5',     // Teal accent
    muted: '#4E5058',      // Muted gray
};

export class ExtendedEmbedBuilder extends EmbedBuilder {
    constructor(color) {
        super();
        this.setColor(color || Colors.primary);
    }

    // Chainable methods
    title(title) {
        return this.setTitle(title);
    }

    thumb(uri) {
        return this.setThumbnail(uri);
    }

    desc(text) {
        return this.setDescription(text);
    }

    footer(options) {
        return this.setFooter(options);
    }

    img(uri) {
        return uri ? this.setImage(uri) : this;
    }

    // Preset styles for v4 minimalist UI
    static success(description) {
        return new ExtendedEmbedBuilder(Colors.success).desc(description);
    }

    static error(description) {
        return new ExtendedEmbedBuilder(Colors.error).desc(description);
    }

    static info(description) {
        return new ExtendedEmbedBuilder(Colors.info).desc(description);
    }

    static warning(description) {
        return new ExtendedEmbedBuilder(Colors.warning).desc(description);
    }

    // Minimalist card style
    card(title, content) {
        return this.setTitle(title).setDescription(content);
    }
}
