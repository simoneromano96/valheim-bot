import { fastify, FastifyReply, FastifyRequest } from "fastify";
import fastifyAuth from "fastify-auth";
import fastifyBasicAuth from "fastify-basic-auth";

import { Client, TextChannel } from 'discord.js';

import { config } from './config';

const validate = async (username: string, password: string, req: FastifyRequest, res: FastifyReply) => {
  if (username !== config.basicAuth.username && password !== config.basicAuth.password) {
    res.status(401)
    res.send("You're gay!")
  }
}

const main = async () => {
  // Discord Client
  const client = new Client();
  await client.login(config.apiToken);

  client.on('ready', async () => {
    console.log(`Logged in as ${client?.user?.tag}!`)
  })

  client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('pong')
    }
  })

  const valheimChannel = await client.channels.fetch(config?.channelId || "") as TextChannel

  // Fastify HTTP Server
  const app = fastify({
    logger: true,
  })

  app.register(fastifyAuth)
  app.register(fastifyBasicAuth, { authenticate: { realm: config.basicAuth.realm }, validate })

  app.after(() => {
    app.addHook("preHandler", app.auth([app.basicAuth]))
  })

  app.get("/server/pre-start", async (req, res) => {
    await valheimChannel.send("Server is starting! You will be able to play soon")
    res.send("ok")
  })

  app.get("/server/post-start", async (req, res) => {
    await valheimChannel.send("Server is up! You can start playing ;)")
    res.send("ok")
  })

  app.get("/server/pre-shutdown", async (req, res) => {
    await valheimChannel.send("Server is shutting down! GTFO")
    res.send("ok")
  })

  app.get("/server/post-shutdown", async (req, res) => {
    await valheimChannel.send("Server is shut down!")
    res.send("ok")
  })

  app.get("/server/restart", async (req, res) => {
    await valheimChannel.send("Server is restarting! Wait for the supercomputer to launch the game")
    res.send("ok")
  })

  app.get("/backup/start", async (req, res) => {
    await valheimChannel.send("Server is doing a backup! Slowdown incoming! D:")
    res.send("ok")
  })

  app.get("/backup/stop", async (req, res) => {
    await valheimChannel.send("Server has finished the backup! You can do what you want again")
    res.send("ok")
  })

  await app.listen(config.port, "0.0.0.0")
}

main()
  .then(() => console.log("Application started"))
  .catch((e) => console.error(e))
