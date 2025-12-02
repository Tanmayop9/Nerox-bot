/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Extended Button Builder for support bot
 */

import { ButtonBuilder, ButtonStyle } from 'discord.js';

export class ExtendedButtonBuilder extends ButtonBuilder {
    constructor() {
        super();
    }

    primary(id, label) {
        return this.setCustomId(id).setLabel(label).setStyle(ButtonStyle.Primary);
    }

    secondary(id, label) {
        return this.setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary);
    }

    success(id, label) {
        return this.setCustomId(id).setLabel(label).setStyle(ButtonStyle.Success);
    }

    danger(id, label) {
        return this.setCustomId(id).setLabel(label).setStyle(ButtonStyle.Danger);
    }

    link(url, label) {
        return this.setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
    }

    emoji(emoji) {
        return this.setEmoji(emoji);
    }
}
