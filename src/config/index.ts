export const config = {
  discord: {
    // New version WIP
    clientId: process.env.APP_DISCORD_CLIENT_ID,
    botToken: process.env.APP_DISCORD_BOT_TOKEN,
    guildId: process.env.APP_DISCORD_GUILD_ID,
    channelId: process.env.APP_DISCORD_CHANNEL_ID,
    enabled: process.env.APP_DISCORD_ENABLED === "true",
    restartRolePermissionId: process.env.APP_DISCORD_RESTART_ROLE_PERMISSION_ID || "none",
  },
  server: {
    hostname: process.env.APP_SERVER_HOSTNAME || "localhost",
    protocol: process.env.APP_SERVER_PROTOCOL || "http",
    port: process.env.APP_SERVER_PORT || "8080",
  },
  gameServer: {
    hostname: process.env.APP_GAME_SERVER_HOSTNAME || "localhost",
  },
  basicAuth: {
    username: process.env.APP_BASIC_AUTH_USERNAME || "username",
    password: process.env.APP_BASIC_AUTH_PASSWORD || "password",
    realm: process.env.APP_BASIC_AUTH_REALM || "heaven",
  },
  nexus: {
    apiToken: process.env.APP_NEXUS_API_TOKEN || "",
    enabled: process.env.APP_NEXUS_ENABLED === "true",
    gameId: "3667",
    gameDomainName: "valheim",
  },
  db: {
    path: process.env.APP_DB_PATH || "../",
    name: process.env.APP_DB_NAME || "valheim-bot-db-dev",
  },
  static: {
    publicPath: process.env.APP_STATIC_PUBLIC_PATH || "/static",
    localPath: process.env.APP_STATIC_LOCAL_PATH || "static",
  },
  logger: {
    prettyPrint: true,
  },
  redis: {
    hostname: process.env.APP_REDIS_HOST || "localhost",
  },
}
