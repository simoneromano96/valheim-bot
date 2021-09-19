import { FastifyPluginCallback } from "fastify"
import Docker from "dockerode"
import { Client as DiscordClient, TextChannel, Intents, GuildMemberRoleManager, ApplicationCommandData } from "discord.js"

import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"

import { config } from "../config"
import { logger } from "../logger"
import { getModInfoList, getObservedModList } from "../db"
import { observeMod } from "../nexus/api"

const discordAPI = new REST({ version: "9" }).setToken(config.discord.botToken)

export const discordClient = new DiscordClient({ intents: [Intents.FLAGS.GUILDS] })

const commands: ApplicationCommandData[] = [
  {
    name: "ping",
    description: "Ping the bot",
  },
  {
    name: "get_observed",
    description: "Gets current observed mod list",
  },
  {
    name: "get_info",
    description: "Gets current mod info list",
  },
  {
    name: "observe",
    description: "Add a mod to observed list",
    options: [
      {
        name: "id",
        description: "The nexus mod id",
        required: true,
        type: 4,
      },
    ],
  },
  {
    name: "server",
    description: "Gets Valheim server hostname",
  },
  {
    name: "restart",
    description: "Restarts Valheim server docker container",
  },
]

class ForbiddenCommandError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export const initDiscordAPI: FastifyPluginCallback = async (app, _options, done): Promise<void> => {
  try {
    await discordAPI.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), { body: commands })
    logger.info("Sent commands to Discord API")
  } catch (error) {
    logger.error(error as Error)
  }

  // Discord Client
  await discordClient.login(config.discord.botToken)

  discordClient.on("ready", () => {
    logger.info(`Logged in as ${discordClient?.user?.tag}!`)
  })

  const valheimChannel = (await discordClient.channels.fetch(config.discord.channelId)) as TextChannel

  await valheimChannel.send("Beep Boop, bot v2 is up and running!")

  // // Docker instance
  // const dockerClient = new Docker({ socketPath: "/var/run/docker.sock" })

  // // Get services with lloesche/valheim-server image
  // const services = await dockerClient.listContainers({ filters: { ancestor: ["lloesche/valheim-server"] } })

  // // Could not find any container
  // if (services.length < 1) {
  //   await valheimChannel.send("Could not find server container!")
  //   throw new Error("Could not find server container!")
  // }

  // await valheimChannel.send(`Bibop, found ${services.length} valheim servers`)

  // const valheimServerContainerId = services[0]?.Id

  // const valheimServerContainer = dockerClient.getContainer(valheimServerContainerId)

  discordClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return

    switch (interaction.commandName) {
      case "ping": {
        await interaction.reply(
          "What did you expect? `Pong` maybe? Are you gonna *shit* yourself now? Maybe *piss and cry*? **BeepBoop** motherfucker",
        )
        break
      }
      case "server": {
        await interaction.reply(config.server.hostname)
        break
      }
      case "get_observed": {
        const currentModList = await getObservedModList()
        await interaction.reply(JSON.stringify(currentModList))
        break
      }
      case "get_info": {
        const currentModList = await getModInfoList()
        await interaction.reply(JSON.stringify(currentModList.map(({ name, summary, downloadURL }) => ({ name, summary, downloadURL }))))
        break
      }
      case "observe": {
        const id = interaction.options.getInteger("id", true)
        const currentModList = await observeMod(id)
        await interaction.reply(JSON.stringify(currentModList))
        break
      }
      case "restart": {
        try {
          if (interaction.member?.roles instanceof GuildMemberRoleManager) {
            const role = interaction.member.roles.resolve(config.discord.restartRolePermissionId)
            if (!role) {
              throw new ForbiddenCommandError("No role")
            }
          } else if (Array.isArray(interaction.member?.roles)) {
            const role = interaction.member?.roles.find((role) => role === config.discord.restartRolePermissionId)
            if (!role) {
              throw new ForbiddenCommandError("No role")
            }
          } else {
            throw new ForbiddenCommandError("No roles")
          }
          await interaction.reply("ACK, launching a restart")
          // await valheimServerContainer.restart()
        } catch (error) {
          if (error instanceof ForbiddenCommandError) {
            await interaction.reply("Your *pp* is too *small*! And I've seen many since I am a bot in the interwebs")
          } else {
            logger.error(error as Error)
            await interaction.reply("Qualquadra non cosa, scrivi a GESU")
          }
        }
        break
      }
      default:
        break
    }
  })

  const preStartSchema = {
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

  return done()
}
