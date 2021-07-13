export const config = {
  discord: {
    apiToken: process.env.APP_DISCORD_API_TOKEN || "",
    channelId: process.env.APP_DISCORD_CHANNEL_ID || "",
    guildId: process.env.APP_DISCORD_GUILD_ID || "",
    enabled: process.env.APP_DISCORD_ENABLED === "true",
    restartRolePermissionID: process.env.APP_DISCORD_RESTART_ROLE_PERMISSION_ID || "none",
  },
  port: process.env.APP_PORT || "8080",
  publicIP: process.env.APP_PUBLIC_IP || "localhost",
  basicAuth: {
    username: process.env.APP_BASIC_AUTH_USERNAME || "username",
    password: process.env.APP_BASIC_AUTH_PASSWORD || "password",
    realm: process.env.APP_BASIC_AUTH_REALM || "heaven",
  },
  nexus: {
    apiToken: process.env.APP_NEXUS_API_TOKEN || "",
    enabled: process.env.APP_NEXUS_ENABLED === "true",
    valheimId: "3667",
  },
}
