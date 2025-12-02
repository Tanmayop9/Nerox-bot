/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Button Builder
 */

import { ButtonStyle, ButtonBuilder } from 'discord.js';

export class ExtendedButtonBuilder extends ButtonBuilder {
    constructor() {
        super();
    }

    // Link button
    link(label, url) {
        return this.setStyle(ButtonStyle.Link).setURL(url).setLabel(label);
    }

    // Styled buttons
    primary(customId, label, emoji, disabled = false) {
        return this._build(ButtonStyle.Primary, customId, label, emoji, disabled);
    }

    secondary(customId, label, emoji, disabled = false) {
        return this._build(ButtonStyle.Secondary, customId, label, emoji, disabled);
    }

    success(customId, label, emoji, disabled = false) {
        return this._build(ButtonStyle.Success, customId, label, emoji, disabled);
    }

    danger(customId, label, emoji, disabled = false) {
        return this._build(ButtonStyle.Danger, customId, label, emoji, disabled);
    }

    // Internal builder
    _build(style, customId, label, emoji, disabled) {
        this.setCustomId(customId).setStyle(style);
        if (label) this.setLabel(label);
        if (emoji) this.setEmoji(emoji);
        if (disabled) this.setDisabled(true);
        return this;
    }
}
