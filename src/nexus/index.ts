import nexusApi, { IModInfo } from "@nexusmods/nexus-api"
import { Job, Queue, QueueScheduler, Worker } from "bullmq"
import chalk from "chalk"
import { FastifyPluginCallback, FastifySchema } from "fastify"

import { config } from "../config"
import { valheimBotDb } from "../db"
import { DBKeys, IObservedMod, IObserveMod, ModInfoList, ObservedModList, ObserveMod } from "../types"

const { nexus } = config

/**
 * Initializes all APIs for nexus
 */
export const initNexusAPI: FastifyPluginCallback = async (app, options, done) => {
  //inizializzo il client nexus
  const nexusClient = await nexusApi.create(nexus.apiToken, "Valheim", "0.0.0", nexus.valheimId)

  new QueueScheduler("modsQueue")
  const processModsQueue = new Queue("modsQueue")

  await processModsQueue.add("evaluateModListJob", null, {
    repeat: {
      // 1000ms -> 60s -> 60m -> 1h
      every: 1000 * 60 * 60,
    },
  })

  const worker = new Worker(processModsQueue.name, async () => {
    // 1. Get currently observed mod list
    const mods: IObservedMod[] = (await valheimBotDb.get(DBKeys.OBSERVED_MOD_LIST)) ?? []
    // 2 Fetch the mod info list
    const modInfoListPromises = mods.map(({ mod_id: modId }) => nexusClient.getModInfo(modId, nexus.valheimId))
    const modInfoList = await Promise.all(modInfoListPromises)
    // 3. Save in the db
    await valheimBotDb.put(DBKeys.MOD_INFO_LIST, modInfoList)
  })

  //fare delete per togliere dalla modsToFetch una mod, capire come prender ele info che abbiamo sul db della mod X e vedere se c'è una differenza per notificarla
  //fare i comandi per il bot(che siano autocompletabili da discord), scaricare la mod e servirla da un server di file statici
  //fare comando !get per prendere il link dal server e POSTARE tipo NOMEMOD: LINK.

  worker.on("completed", (job) => {
    console.log(chalk.green(`${job.id} has completed!`))
  })

  worker.on("failed", (job: Job, err: Error) => {
    console.log(chalk.red(`${job.id} has failed with ${err.message}`))
  })

  const addModToObservedModsSchema = {
    summary: "Observe a mod",
    description: "Adds a mod to the observed mods list",
    body: ObserveMod,
    response: {
      201: {
        description: "Succesful response",
        ...ObservedModList,
      },
    },
  }

  app.post<{ Body: IObserveMod }>(
    "/mods",
    {
      schema: addModToObservedModsSchema,
    },
    async (req, res) => {
      const mods: IObservedMod[] = (await valheimBotDb.get(DBKeys.OBSERVED_MOD_LIST)) ?? []
      mods.push({ mod_id: req.body.id })
      await valheimBotDb.put(DBKeys.OBSERVED_MOD_LIST, mods)
      res.status(201).send(mods)
    },
  )

  const getModInfoListSchema: FastifySchema = {
    summary: "Gets evaluated mods",
    description: "Gets all mods that have been evaluated",
    response: {
      200: {
        description: "Succesful response",
        ...ModInfoList,
      },
    },
  }

  app.get("/mods", { schema: getModInfoListSchema }, async (req, res) => {
    const mods: IModInfo[] = (await valheimBotDb.get(DBKeys.MOD_INFO_LIST)) ?? []
    res.send(mods)
  })

  done()
}
