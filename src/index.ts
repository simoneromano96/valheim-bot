import { fastify, FastifyReply, FastifyRequest } from "fastify";
import fastifyAuth from "fastify-auth";
import fastifyBasicAuth from "fastify-basic-auth";
import Docker from "dockerode";
import bullmq from "bullmq"
import level from 'level';
import { join } from 'path'
import Nexus, { IModInfo } from "@nexusmods/nexus-api";


import { Client, TextChannel } from 'discord.js';

import { config } from './config';

const validate = async (username: string, password: string, req: FastifyRequest, res: FastifyReply) => {
  if (username !== config.basicAuth.username && password !== config.basicAuth.password) {
    res.status(401)
    res.send("You're gay!")
  }
}

type Data = {
  mods: IModInfo[]
}



const main = async () => {

  //valueEncoding json serve a specificare il nostro encoding nel database,  specifichiamo il formato insomma
  const db = level('my-db', {valueEncoding: "json"})

 /*  // Use JSON file for storage
  const file = join(__dirname, 'db.json')
  const adapter = new lowdb.JSONFile<Data>('db.json')
  const db = new lowdb.Low<Data>(adapter)

  // Read data from JSON file, this will set db.data content
  await db.read()

  // If file.json doesn't exist, db.data will be null
  // Set default data
  db.data ||= { mods: [] }    

  console.log(db.data.mods) */
  
  const nexusClient = await Nexus.create(config.nexus.apiToken!, "Valheim", "0.0.0", config.nexus.valheimId )
  /* const modInfo = await nexusClient.getModInfo(parsedMod[0].mod_id, config.nexus.valheimId) 
  console.log(modInfo) */
  
  /* const games = await nexusClient.getGames()
  console.log(games.find(game => game.name.toLowerCase() === "valheim"))
  const valheimInfo = await nexusClient.getGameInfo("3667")
  console.log(valheimInfo) */

  // Discord Client
  const client = new Client();
  await client.login(config.apiToken);

  client.on('ready', async () => {
    console.log(`Logged in as ${client?.user?.tag}!`)
  })

  const valheimChannel = await client.channels.fetch(config?.channelId || "") as TextChannel

  await valheimChannel.send("Beep Boop, bot is up and running!")

  // Docker instance
  const dockerClient = new Docker({ socketPath: "/var/run/docker.sock" })

  const services = await dockerClient.listContainers({ filters: {"ancestor": ["lloesche/valheim-server"]} });

  /* if (services.length < 1) {
    await valheimChannel.send("Could not find server container!")
    throw new Error("Could not find server container!")
  } */

  await valheimChannel.send(`Bibop, found ${services.length} valheim servers`)

  const valheimServerContainerId = services[0]?.Id

  const valheimServerContainer = dockerClient.getContainer(valheimServerContainerId)

  client.on('message', async (msg) => {
    switch (msg.content.toLocaleLowerCase()) {
      case "!server":
        await msg.reply(config.publicIP)
        break;
      case "!restart":
        const hasRolePermission = msg.member?.roles.cache.get("500058631002259476")
        if (hasRolePermission) {
          await msg.reply("ACK, launching a restart")
          await valheimServerContainer.restart()
        } else {
          await msg.reply("Your *pp* is too *small*! And I've seen many since I am a bot in the interwebs")
        }
        break
      case "ping":
        await msg.reply('What did you expect? `Pong` maybe? Are you gonna *shit* yourself now? Maybe *piss and cry*? **BeepBoop** motherfucker')
        break
      default:
        break
    }
  })

  // Fastify HTTP Server
  const app = fastify({
    logger: true,
  })

  app.register(fastifyAuth)
  app.register(fastifyBasicAuth, { authenticate: { realm: config.basicAuth.realm }, validate })

  app.after(() => {
    app.addHook("preHandler", app.auth([app.basicAuth]))
  })

  // START
  app.get("/server/pre-start", async (req, res) => {
    await valheimChannel.send("Server is **starting**! You will be able to play soon")
    res.send("ok")
  })

  app.get("/server/post-start", async (req, res) => {
    await valheimChannel.send("Server is **up**! You can start playing ;)")
    res.send("ok")
  })

  // SHUTDOWN
  app.get("/server/pre-shutdown", async (req, res) => {
    await valheimChannel.send("Server is **shutting down**! GTFO")
    res.send("ok")
  })

  app.get("/server/post-shutdown", async (req, res) => {
    await valheimChannel.send("Server is **shut down**!")
    res.send("ok")
  })

  // RESTART
  app.get("/server/pre-restart", async (req, res) => {
    await valheimChannel.send("Server is **restarting**! Wait for the supercomputer to launch the game")
    res.send("ok")
  })

  app.get("/server/post-restart", async (req, res) => {
    await valheimChannel.send("Server has **restarted** and is back up and running. Start playing again!")
    res.send("ok")
  })

  // BACKUP
  app.get("/backup/start", async (req, res) => {
    await valheimChannel.send("Server has **started** a **backup**! Slowdown incoming! D:")
    res.send("ok")
  })

  app.get("/backup/stop", async (req, res) => {
    await valheimChannel.send("Server has **finished** the **backup**! You can do what you want again")
    res.send("ok")
  })

  app.get("/mods/add/:id", async (req, res) => {
    const mods:Partial<IModInfo>[] = await db.get("mods") ?? []
    //dobbiamo validare le request
    const id:string = (req.params as any).id 
    mods.push({mod_id: parseInt(id)})
    await db.put("mods", mods)
    res.send("Ok")
  })

  app.get("/mods", async (req, res) => {
    const mods:Partial<IModInfo>[] = await db.get("mods") ?? []
    //dobbiamo validare le request
    res.send(mods)
  })
  
  await app.listen(config.port, "0.0.0.0")
}

main()
  .then(() => console.log("Application started"))
  .catch((e) => console.error(e))
