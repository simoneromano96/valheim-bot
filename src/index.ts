// Node native modules
import { resolve } from "path"
import { promises as fsPromises, constants as fsConstants } from "fs"

// Fastify
import { fastify, FastifyReply, FastifyRequest } from "fastify"
import fastifyAuth from "fastify-auth"
import fastifyBasicAuth from "fastify-basic-auth"
import fastifySwagger from "fastify-swagger"
import fastifyStatic from "fastify-static"

import { config } from "./config"
import { initLevelDB } from "./db"
import { initNexusAPI } from "./nexus"
import { initDiscordAPI } from "./discord"
import { logger } from "./logger"

const validate = async (username: string, password: string, req: FastifyRequest, res: FastifyReply) => {
  if (username !== config.basicAuth.username && password !== config.basicAuth.password) {
    res.status(401)
    res.send("You're gay!")
  }
}

const main = async () => {
  logger.info("Initializing Valheim Bot")

  const localPath = resolve(config.static.localPath)
  logger.info("Local public path: " + resolve(localPath))

  try {
    await fsPromises.access(resolve(localPath), fsConstants.W_OK)
  } catch (error) {
    await fsPromises.mkdir(resolve(localPath))
  }

  // Fastify HTTP Server
  const app = fastify({
    logger: { ...config.logger },
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
  app.register(fastifyStatic, {
    root: localPath,
    prefix: config.static.publicPath, // optional: default '/'
  })

  app.after(() => {
    app.addHook("preHandler", app.auth([app.basicAuth]))
  })

  if (config.discord.enabled) {
    logger.info("Initializing discord")
    await app.register(initDiscordAPI, { prefix: "/discord" })
    logger.info("Initialized discord!")
  }

  if (config.nexus.enabled) {
    logger.info("Initializing nexus")
    await initLevelDB()
    await app.register(initNexusAPI, { prefix: "/nexus" })
    logger.info("Initialized nexus!")
  }

  await app.listen(config.server.port, "0.0.0.0")

  logger.info("Valheim Bot initialized!")
}

main().catch(console.error)
