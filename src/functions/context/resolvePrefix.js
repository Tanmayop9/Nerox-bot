export const resolvePrefix = async (ctx, noPrefix) => {
    const guildPrefix = ctx.guild ? await ctx.client.db.prefix.get(ctx.guild.id) : null;
    const defaultPrefix = ctx.client.prefix;
    const activePrefix = guildPrefix || defaultPrefix;

    return (ctx.content.startsWith(activePrefix)
        ? activePrefix
        : ctx.content.startsWith(`<@${ctx.client.user.id}>`) || ctx.content.startsWith(`<@!${ctx.client.user.id}>`)
            ? `<@${ctx.client.user.id}>`
            : noPrefix
                ? ''
                : null);
};
/**@codeStyle - https://google.github.io/styleguide/tsguide.html */