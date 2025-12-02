/**
 * @nerox-support v1.0.0
 * @author Tanmay @ NeroX Studios
 * @description Guild member remove event for leave messages
 */

export default class GuildMemberRemove {
    constructor() {
        this.name = 'guildMemberRemove';
    }

    execute = async (client, member) => {
        if (member.user.bot) return;

        const welcomeSettings = await client.db.welcomeSettings.get(member.guild.id);
        if (!welcomeSettings?.leaveEnabled || !welcomeSettings.leaveChannelId) return;

        const channel = member.guild.channels.cache.get(welcomeSettings.leaveChannelId);
        if (!channel) return;

        // Replace placeholders in message
        let message = welcomeSettings.leaveMessage || '{username} has left **{server}**. We now have {count} members.';
        message = message
            .replace(/{user}/g, member.toString())
            .replace(/{username}/g, member.user.username)
            .replace(/{tag}/g, member.user.tag)
            .replace(/{server}/g, member.guild.name)
            .replace(/{count}/g, member.guild.memberCount.toString());

        const embed = client
            .embed('#F23F43')
            .title('👋 Goodbye!')
            .desc(message)
            .thumb(member.user.displayAvatarURL({ size: 256 }))
            .footer({ text: `${member.guild.memberCount} members remaining` })
            .setTimestamp();

        await channel.send({ embeds: [embed] }).catch(() => null);
    };
}
