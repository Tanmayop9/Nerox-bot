/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Guild member add event for welcome messages and auto-roles
 */

export default class GuildMemberAdd {
    constructor() {
        this.name = 'guildMemberAdd';
    }

    execute = async (client, member) => {
        if (member.user.bot) return;

        // Auto-role
        const autoRoles = await client.db.autoRoles.get(member.guild.id);
        if (autoRoles?.length) {
            for (const roleId of autoRoles) {
                const role = member.guild.roles.cache.get(roleId);
                if (role) {
                    await member.roles.add(role).catch(() => null);
                }
            }
        }

        // Welcome message
        const welcomeSettings = await client.db.welcomeSettings.get(member.guild.id);
        if (!welcomeSettings?.enabled || !welcomeSettings.channelId) return;

        const channel = member.guild.channels.cache.get(welcomeSettings.channelId);
        if (!channel) return;

        // Replace placeholders in message
        let message = welcomeSettings.message || 'Welcome {user} to **{server}**! You are member #{count}.';
        message = message
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount.toString());

        const embed = client
            .embed('#23A55A')
            .title('👋 Welcome!')
            .desc(message)
            .thumb(member.user.displayAvatarURL({ size: 256 }))
            .footer({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => null);
    };
}
