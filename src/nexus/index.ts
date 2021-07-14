import nexusApi from "@nexusmods/nexus-api"
import { Job, Queue, QueueScheduler, Worker } from "bullmq"
import chalk from "chalk"
import { FastifyPluginCallback } from "fastify"

import { config } from "../config"
import { getModInfoById, getModInfoList, getObservedModById, getObservedModList, putModInfoList } from "../db"
import { IModInfoList, IObserveMod, ModInfoList, ObservedModList, ObserveMod } from "../types"
import { observeMod, stopObserveMod } from "./api"

const { nexus } = config

/**
 * Initializes all APIs for nexus
 */
export const initNexusAPI: FastifyPluginCallback = async (app, options, done) => {
  // inizializzo il client nexus
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
    const observedModList = await getObservedModList()
    // 2 Fetch the mod info list
    const modInfoListPromises = observedModList.map(({ mod_id: modId }) => nexusClient.getModInfo(modId, nexus.valheimId))
    const modInfoList = (await Promise.all(modInfoListPromises)) as IModInfoList
    const prevModInfoList = await getModInfoList()
    // 3. Check for differences
    for (const modInfo of modInfoList) {
      const prevModInfo = prevModInfoList.find((mod) => mod.mod_id === modInfo.mod_id)
      if (modInfo.updated_timestamp !== prevModInfo?.updated_timestamp) {
        console.log(chalk.green("A mod has been updated!"))
      }
    }
    // 4. Save in the db
    await putModInfoList(modInfoList)
  })

  // capire come prendere le info che abbiamo sul db della mod X e vedere se c'è una differenza per notificarla
  // fare i comandi per il bot(che siano autocompletabili da discord),
  // scaricare la mod e servirla da un server di file statici
  // fare comando !get per prendere il link dal server e POSTARE tipo NOMEMOD: LINK.

  worker.on("completed", (job) => {
    console.log(chalk.green(`${job.id} has completed!`))
  })

  worker.on("failed", (job: Job, err: Error) => {
    console.log(chalk.red(`${job.id} has failed with ${err.message}`))
  })

  const observeModSchema = {
    summary: "Observe a mod",
    description: "Adds a mod to the observed mods list",
    body: ObserveMod,
    response: {
      201: {
        description: "Successful response",
        ...ObservedModList,
      },
    },
  }

  app.post<{ Body: IObserveMod }>("/mods/observed", { schema: observeModSchema }, async (req, res) => {
    const observeModId = req.body.id
    const observedModList = await observeMod(observeModId)
    res.status(201).send(observedModList)
  })

  const getModInfoListSchema = {
    summary: "Gets evaluated mods",
    description: "Gets all mods that have been evaluated",
    response: {
      200: {
        description: "Successful response",
        ...ModInfoList,
      },
    },
  }

  app.get("/mods/info", { schema: getModInfoListSchema }, async (req, res) => {
    const mods = await getModInfoList()
    res.send(mods)
  })

  const getModInfoSchema = {
    summary: "Get evaluated mod",
    description: "Gets a mod that have been evaluated by id",
    params: ObserveMod,
    response: {
      200: {
        description: "Successful response",
        ...ModInfoList,
      },
    },
  }

  app.get<{ Params: IObserveMod }>("/mods/info/:id", { schema: getModInfoSchema }, async (req, res) => {
    const modId = req.params.id
    const mod = await getModInfoById(modId)
    res.send(mod)
  })

  const getObservedModSchema = {
    summary: "Gets an observed mod",
    description: "Gets an observed mod by id",
    params: ObserveMod,
    response: {
      200: {
        description: "Successful response",
        ...ObservedModList,
      },
    },
  }

  app.get<{ Params: IObserveMod }>("/mods/observed/:id", { schema: getObservedModSchema }, async (req, res) => {
    const modId = req.params.id
    const observedMod = await getObservedModById(modId)
    res.send(observedMod)
  })

  const deleteObservedModSchema = {
    summary: "Delete an observed mod",
    description: "Stops observing a mod by id",
    params: ObserveMod,
    response: {
      200: {
        description: "Successful response",
        ...ObservedModList,
      },
    },
  }

  app.delete<{ Params: IObserveMod }>("/mods/observed/:id", { schema: deleteObservedModSchema }, async (req, res) => {
    const modId = req.params.id
    const filteredMods = await stopObserveMod(modId)
    res.send(filteredMods)
  })

  done()
}
