import { FastifyPluginCallback, FastifySchema } from "fastify"
import { Client as DiscordClient, TextChannel } from "discord.js"
import chalk from "chalk"

import { config } from "../config"

export const discordClient = new DiscordClient({
  intents: [
    "GUILDS",
    "GUILD_BANS",
    "GUILD_EMOJIS",
    "GUILD_INTEGRATIONS",
    "GUILD_WEBHOOKS",
    "GUILD_INVITES",
    "GUILD_VOICE_STATES",
    "GUILD_MESSAGES",
    "GUILD_MESSAGE_REACTIONS",
    "GUILD_MESSAGE_TYPING",
    "DIRECT_MESSAGES",
    "DIRECT_MESSAGE_REACTIONS",
    "DIRECT_MESSAGE_TYPING",
  ],
})

const initDiscordClient = () =>
  new Promise<void>((resolve, reject) => {
    discordClient
      .login(config.discord.apiToken)
      .then(() => {
        // Wait for 10s before rejecting
        const timeoutRef = setTimeout(reject, 10000)
        discordClient.on("ready", () => {
          console.log(chalk.green(`Logged in as ${discordClient?.user?.tag}!`))
          clearTimeout(timeoutRef)
          resolve()
        })
      })
      .catch(reject)
  })

export const initDiscordAPI: FastifyPluginCallback = async (app, _options, done): Promise<void> => {
  // Discord Client initialization
  await initDiscordClient()

  //@ts-ignore
  const valheimChannel = (await discordClient.channels.fetch(config.discord.channelId)) as TextChannel

  await valheimChannel.send("Beep Boop, bot is up and running!")

  // Docker instance
  // const dockerClient = new Docker({ socketPath: "/var/run/docker.sock" })

  // const services = await dockerClient.listContainers({ filters: { ancestor: ["lloesche/valheim-server"] } })

  // if (services.length < 1) {
  //   await valheimChannel.send("Could not find server container!")
  //   // throw new Error("Could not find server container!")
  // }

  // await valheimChannel.send(`Bibop, found ${services.length} valheim servers`)

  // const valheimServerContainerId = services[0]?.Id

  // const valheimServerContainer = dockerClient.getContainer(valheimServerContainerId)

  // console.log(await discordClient.api)

  //@ts-ignore
  const guild = await discordClient.guilds.fetch(config.discord.guildId)

  const commandsManager = guild.commands

  const commands = await commandsManager.fetch()
  console.log(commands)

  try {
    await commandsManager.create({ name: "test1", description: "Just a test" })
  } catch (error) {
    console.error(error)
  }

  discordClient.on("message", async (msg) => {
    switch (msg.content.toLocaleLowerCase()) {
      case "!server":
        await msg.reply(config.publicIP)
        break
      case "!restart":
        const hasRolePermission = msg.member?.roles.cache.get("500058631002259476")
        if (hasRolePermission) {
          await msg.reply("ACK, launching a restart")
          // await valheimServerContainer.restart()
        } else {
          await msg.reply("Your *pp* is too *small*! And I've seen many since I am a bot in the interwebs")
        }
        break
      case "ping":
        await msg.reply(
          "What did you expect? `Pong` maybe? Are you gonna *shit* yourself now? Maybe *piss and cry*? **BeepBoop** motherfucker",
        )
        break
      default:
        break
    }
  })

  const preStartSchema: FastifySchema = {
    summary: "Pre start",
    description: "Called when the valheim server is at pre-start",
    response: {
      200: {
        description: "Successful response",
        type: "string",
      },
    },
  }

  // START
  app.get("/server/pre-start", { schema: preStartSchema }, async (req, res) => {
    await valheimChannel.send("Server is **starting**! You will be able to play soon")
    res.send("ok")
  })

  app.get(
    "/server/post-start",
    {
      schema: {
        summary: "Post start",
        description: "Called when the valheim server has started",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server is **up**! You can start playing ;)")
      res.send("ok")
    },
  )

  // SHUTDOWN
  app.get(
    "/server/pre-shutdown",
    {
      schema: {
        summary: "Pre shutdown",
        description: "Called when the valheim server is shutting down",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server is **shutting down**! GTFO")
      res.send("ok")
    },
  )

  app.get(
    "/server/post-shutdown",
    {
      schema: {
        summary: "Post shutdown",
        description: "Called when the valheim server has shut down",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server is **shut down**!")
      res.send("ok")
    },
  )

  // RESTART
  app.get(
    "/server/pre-restart",
    {
      schema: {
        summary: "Pre restart",
        description: "Called when the valheim server is restarting",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server is **restarting**! Wait for the supercomputer to launch the game")
      res.send("ok")
    },
  )

  app.get(
    "/server/post-restart",
    {
      schema: {
        summary: "Post restart",
        description: "Called when the valheim server has restarted",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server has **restarted** and is back up and running. Start playing again!")
      res.send("ok")
    },
  )

  // BACKUP
  app.get(
    "/backup/start",
    {
      schema: {
        summary: "Start backup",
        description: "Called when the valheim server started doing a backup",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server has **started** a **backup**! Slowdown incoming! D:")
      res.send("ok")
    },
  )

  app.get(
    "/backup/stop",
    {
      schema: {
        summary: "Stop backup",
        description: "Called when the valheim server has finished the backup",
        response: {
          200: {
            description: "Successful response",
            type: "string",
          },
        },
      },
    },
    async (req, res) => {
      await valheimChannel.send("Server has **finished** the **backup**! You can do what you want again")
      res.send("ok")
    },
  )

  done()
}
