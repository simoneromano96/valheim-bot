export const config = {
  apiToken: process.env.APP_BOT_TOKEN,
  channelId: process.env.APP_CHANNEL_ID,
  port: process.env.APP_PORT || "8080",
  publicIP: process.env.APP_PUBLIC_IP || "localhost",
  restartRolePermissionID: process.env.APP_RESTART_ROLE_PERMISSION_ID || "none",
  basicAuth: {
    username: process.env.APP_BASIC_AUTH_USERNAME || "username",
    password: process.env.APP_BASIC_AUTH_PASSWORD || "password",
    realm: process.env.APP_BASIC_AUTH_REALM || "heaven",
  }
}
