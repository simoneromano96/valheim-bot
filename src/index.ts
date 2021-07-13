import { fastify, FastifyReply, FastifyRequest } from "fastify"
import fastifyAuth from "fastify-auth"
import fastifyBasicAuth from "fastify-basic-auth"
import fastifySwagger from "fastify-swagger"
import chalk from "chalk"

import { config } from "./config"
import { initLevelDB } from "./db"
import { initNexusAPI } from "./nexus"
import { initDiscordAPI } from "./discord"

const validate = async (username: string, password: string, req: FastifyRequest, res: FastifyReply) => {
  if (username !== config.basicAuth.username && password !== config.basicAuth.password) {
    res.status(401)
    res.send("You're gay!")
  }
}

const main = async () => {
  console.log(chalk.yellow("Initializing Valheim Bot"))

  // Fastify HTTP Server
  const app = fastify({
    logger: true,
  })

  app.register(fastifyAuth)
  app.register(fastifyBasicAuth, { authenticate: { realm: config.basicAuth.realm }, validate })
  app.register(fastifySwagger, {
    routePrefix: "/docs",
    openapi: {
      info: {
        title: "Valheim bot",
        description: "A valheim and nexud mods utility",
        version: "0.1.0",
      },
    },
    exposeRoute: true,
  })

  app.after(() => {
    app.addHook("preHandler", app.auth([app.basicAuth]))
  })

  if (config.discord.enabled) {
    console.log(chalk.yellow("Initializing discord"))
    await app.register(initDiscordAPI, { prefix: "/discord" })
    console.log(chalk.green("Initialized discord"))
  }

  if (config.nexus.enabled) {
    console.log(chalk.yellow("Initializing nexus"))
    await initLevelDB()
    await app.register(initNexusAPI, { prefix: "/nexus" })
    console.log(chalk.green("Initialized nexus"))
  }

  app.post("/", async (req, res) => {
    const response = {
      type: 4,
      data: {
        tts: false,
        content: "Congrats on sending your command!",
        embeds: [],
        allowed_mentions: { parse: [] },
      },
    }
    res.send(response)
  })

  await app.listen(config.port, "0.0.0.0")

  console.log(chalk.green("Valheim Bot initialized!"))
}

main().catch(console.error)
