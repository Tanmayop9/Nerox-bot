/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Base command class for support bot
 */

export class Command {
    constructor() {
        this.usage = '';
        this.admin = false; // Bot Admin Only
        this.owner = false; // Bot Owner Only
        this.staff = false; // Ticket Staff Only
        this.cooldown = 5; // Default cooldown in seconds
        this.aliases = []; // Command Aliases
        this.example = []; // Command Examples
        this.slash = true; // Slash command support
        this.options = []; // Command options (for slash commands)
        this.userPerms = []; // User permissions required
        this.botPerms = []; // Bot permissions required
        /** Assigned dynamically when loading ( `file.name.toLowerCase()` ) */
        this.name = '';
        /** Assigned dynamically when loading ( `folder.name.toLowerCase()` ) */
        this.category = '';
    }
}
