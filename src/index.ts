import { Client, TextChannel } from 'discord.js';
import { fastify } from "fastify";

import { config } from './config';

const main = async () => {
  const client = new Client();
  await client.login(config.apiToken);

  client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`)
  })

  client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('pong')
    }
  })

  const valheimChannel = await client.channels.fetch("830821489178705960") as TextChannel

  const app = fastify({
    logger: true,
  })

  // Add basic auth
  app.get("/server/start", async (req, res) => {
    await valheimChannel.send("Server is up! You can start playing ;)")
    res.send("ok")
  })

  app.get("/server/shutdown", async (req, res) => {
    await valheimChannel.send("Server is down! GTFO")
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

  await app.listen(9000)
}

main()
  .then(() => console.log("Application started"))
  .catch((e) => console.error(e))
