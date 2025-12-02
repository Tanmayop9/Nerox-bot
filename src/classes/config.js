export const config = {
  token: process.env.DISCORD_TOKEN,
  owners: ["1349404026965463072", "991517803700027443"],
  admins: ["991517803700027443"],
  prefix: "&",
  links: {
      support: "https://discord.gg/p6nXDJMeyc"
  },
  backup: "1347901024026759278",
  webhooks: {
    logs: process.env.WEBHOOK_LOGS,
    serveradd: process.env.WEBHOOK_SERVERADD,
    serverchuda: process.env.WEBHOOK_SERVERCHUDA,
    playerLogs: process.env.WEBHOOK_PLAYERLOGS
  }
};