import { fastify, FastifyReply, FastifyRequest } from "fastify";
import fastifyAuth from "fastify-auth";
import fastifyBasicAuth from "fastify-basic-auth";
import fastifySwagger from "fastify-swagger";

import { Static, Type } from '@sinclair/typebox'
import Docker from "dockerode";
import { Queue, Worker, QueueScheduler } from 'bullmq';
import level from 'level';
import { join } from 'path'

import Nexus, { IModInfo } from "@nexusmods/nexus-api";


import { Client, DMChannel, TextChannel } from 'discord.js';

import { config } from './config';
import { REPL_MODE_STRICT } from "repl";

const validate = async (username: string, password: string, req: FastifyRequest, res: FastifyReply) => {
  if (username !== config.basicAuth.username && password !== config.basicAuth.password) {
    res.status(401)
    res.send("You're gay!")
  }
}

// type Data = {
  //   mods: IModInfo[]
  // }
  
  const main = async () => {
  

    //valueEncoding json serve a specificare il nostro encoding nel database,  specifichiamo il formato insomma
    const db = level('my-db', {valueEncoding: "json"})

    try {
      await db.get("modsToFetch")
    } catch (error) {
      await db.put("modsToFetch", [])
    }

    //inizializzo il client nexus
    const nexusClient = await Nexus.create(config.nexus.apiToken!, "Valheim", "0.0.0", config.nexus.valheimId )
    
    const myQueueScheduler = new QueueScheduler('Paint');
    const myQueue = new Queue('Paint');
    
    // Repeat job every 10 seconds but no more than 100 times
    await myQueue.add('bird', null , 
    {
      repeat: {
        every: 1000*60
      }
    });
    
    const worker = new Worker(myQueue.name, async job => {
      //recuperare mod attuali, vedere quali da aggiornare, chiamare la get info per quelle da aggiornare e salvare nel database
      const updateMods = []
      const mods: Partial<IModInfo>[] = await db.get("modsToFetch") ?? []
      for (let index = 0; index < mods.length; index++) {
        const element = mods[index];
        const modInfo = await nexusClient.getModInfo(element.mod_id!, config.nexus.valheimId) 
        updateMods.push(modInfo)
      }
      await db.put("updateMods", updateMods)
  });

  //fare delete per togliere dalla modsToFetch una mod, capire come prender ele info che abbiamo sul db della mod X e vedere se c'è una differenza per notificarla
  //fare i comandi per il bot(che siano autocompletabili da discord), scaricare la mod e servirla da un server di file statici
  //fare comando !get per prendere il link dal server e POSTARE tipo NOMEMOD: LINK.

  worker.on('completed', (job) => {
    console.log(`${job.id} has completed!`);
  });

  worker.on('failed', (job:any, err:any) => {
      console.log(`${job.id} has failed with ${err.message}`);
  });


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
  app.register(fastifySwagger, {
    routePrefix: '/docs',
    openapi: {
      info: {
        title: "Valheim bot",
        description: "A valheim and nexud mods utility",
        version: '0.1.0',
      }
    },
    exposeRoute: true,
  })

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

  const ObserveMod = Type.Object({
    id: Type.Number(),
  });

  type ObserveModType = Static<typeof ObserveMod>;

  app.post<{Body: ObserveModType}>("/mods", {
    schema: {
      summary: 'Observe a mod',
      description: "Adds a mod to the observed mods list",
      body: ObserveMod,
    }
  }, async (req, res) => {
    const mods: Partial<IModInfo>[] = await db.get("modsToFetch") ?? []
    mods.push({ mod_id: req.body.id })
    await db.put("modsToFetch", mods)
    res.send("ok")
  })



  app.get("/mods", async (req, res) => {
    const mods: Partial<IModInfo>[] = await db.get("updateMods") ?? []
    //dobbiamo validare le request
    res.send(mods)
  })
  
  await app.listen(config.port, "0.0.0.0")
}

main()
  .then(() => console.log("Application started"))
  .catch((e) => console.error(e))
