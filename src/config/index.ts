export const config = {
  discord: {
    apiToken: process.env.APP_DISCORD_API_TOKEN || "",
    channelId: process.env.APP_DISCORD_CHANNEL_ID || "",
    enabled: process.env.APP_DISCORD_ENABLED === "true",
    restartRolePermissionID: process.env.APP_DISCORD_RESTART_ROLE_PERMISSION_ID || "none",
  },
  server: {
    hostname: process.env.APP_SERVER_HOSTNAME || "localhost",
    protocol: process.env.APP_SERVER_PROTOCOL || "http",
    port: process.env.APP_SERVER_PORT || "8080",
  },
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
  db: {
    path: process.env.APP_DB_PATH || "../",
    name: process.env.APP_DB_NAME || "valheim-bot-db-dev",
  },
  static: {
    path: process.env.APP_STATIC_PATH || "static",
  },
}
