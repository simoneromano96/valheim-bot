import { FastifyPluginCallback } from "fastify"
import Docker from "dockerode"
import { Client as DiscordClient, TextChannel } from "discord.js"
import { Command, CommanderError } from "commander"

import { config } from "../config"
import { logger } from "../logger"

export const discordClient = new DiscordClient()

export const initDiscordAPI: FastifyPluginCallback = async (app, _options, done): Promise<void> => {
  // Discord Client
  await discordClient.login(config.discord.apiToken)

  discordClient.on("ready", () => {
    logger.info(`Logged in as ${discordClient?.user?.tag}!`)
  })

  const valheimChannel = (await discordClient.channels.fetch(config.discord.channelId)) as TextChannel

  await valheimChannel.send("Beep Boop, bot is up and running!")

  // Docker instance
  const dockerClient = new Docker({ socketPath: "/var/run/docker.sock" })

  // Get services with lloesche/valheim-server image
  const services = await dockerClient.listContainers({ filters: { ancestor: ["lloesche/valheim-server"] } })

  // Could not find any container
  if (services.length < 1) {
    await valheimChannel.send("Could not find server container!")
    throw new Error("Could not find server container!")
  }

  await valheimChannel.send(`Bibop, found ${services.length} valheim servers`)

  const valheimServerContainerId = services[0]?.Id

  const valheimServerContainer = dockerClient.getContainer(valheimServerContainerId)

  discordClient.on("message", async (message) => {
    if (message.author.bot) return
    const program = new Command()
    program.exitOverride()
    program
      .name("")
      .option("-s --server", "Gets Valheim server hostname")
      .option("-r --restart", "Restarts Valheim server docker container")
      .option("-g --get", "Gets current mod info list")
      .option("-p --ping", "Ping the bot")

    try {
      const args = message.content.split(" ")
      const parsed = await program.parseAsync(args, { from: "user" })
      const options = parsed.opts()

      if (options.get) {
        await message.reply("WIP")
      }
      if (options.server) {
        await message.reply(config.server.hostname)
      }
      if (options.restart) {
        const hasRolePermission = message.member?.roles.cache.get("500058631002259476")
        if (hasRolePermission) {
          await message.reply("ACK, launching a restart")
          await valheimServerContainer.restart()
        } else {
          await message.reply("Your *pp* is too *small*! And I've seen many since I am a bot in the interwebs")
        }
      }
      if (options.ping) {
        await message.reply(
          "What did you expect? `Pong` maybe? Are you gonna *shit* yourself now? Maybe *piss and cry*? **BeepBoop** motherfucker",
        )
      }
    } catch (error) {
      if (error instanceof CommanderError && error.code === "commander.helpDisplayed") {
        return await message.reply(program.helpInformation())
      }
      await message.reply(`I crashed :) \n ${error.message}`)
      logger.error(error)
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

  done()
}
