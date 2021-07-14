import nexusApi from "@nexusmods/nexus-api"
import { Job, Queue, QueueScheduler, Worker } from "bullmq"
import chalk from "chalk"
import { FastifyPluginCallback } from "fastify"
import got from "got"
import stream from "stream"
import fs from "fs"
import path from "path"

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
      every: 1000 * 60,
    },
  })
  //QUESTO È IL JOB LOL
  const worker = new Worker(processModsQueue.name, async () => {
    // 1. Get currently observed mod list
    const observedModList = await getObservedModList()
    // 2 Fetch the mod info list
    const modInfoListPromises = observedModList.map(({ mod_id: modId }) => nexusClient.getModInfo(modId, nexus.valheimId))
    const modInfoList = (await Promise.all(modInfoListPromises)) as IModInfoList
    const prevModInfoList = await getModInfoList()
    // 3. Check for differences
    for (let modInfo of modInfoList) {
      // Get saved mod info
      const prevModInfo = prevModInfoList.find((mod) => mod.mod_id === modInfo.mod_id)
      // Check if timestamps are different. If true = aggiornamento.
      if (true || modInfo.updated_timestamp !== prevModInfo?.updated_timestamp) {
        console.log(chalk.green("A mod has been updated!"))
        // Get mod Files
        const modFiles = await nexusClient.getModFiles(modInfo.mod_id, modInfo.domain_name)
        let maxUploadedTimestamp = 0
        let latestFileInfo
        // Per ogni file della mod controlliamo il timestamp e cerco il piu recente
        for (const fileInfo of modFiles.files) {
          if (fileInfo.uploaded_timestamp > maxUploadedTimestamp) {
            maxUploadedTimestamp = fileInfo.uploaded_timestamp
            latestFileInfo = fileInfo
          }
        }
        // se non c'è interrompiamo il flusso (errore)
        if (!latestFileInfo) {
          throw new Error("No File present here :c")
        }

        // prendiamo i link per scaricare
        const downloadURLs = await nexusClient.getDownloadURLs(
          modInfo.mod_id,
          latestFileInfo.file_id,
          undefined,
          undefined,
          modInfo.domain_name,
        )
        // prendo il primo url (CDN)
        const CDNURL = downloadURLs[0]
        //ne ottengo l'estensione
        const extension = path.extname(latestFileInfo.file_name)
        // è un flusso di dati la cui fonte è il download URI, la destinazione è il nostro file system :)
        const fileName = `${modInfo.game_id}-${modInfo.mod_id}${extension}`
        await stream.promises.pipeline(got.stream(CDNURL.URI), fs.createWriteStream(path.join(path.resolve(config.static.path), fileName)))
        modInfo = { ...modInfo, downloadURL: `http://localhost:8080/${config.static.path}/${fileName}` }
      }
    }
    // 4. Save in the db
    await putModInfoList(modInfoList)
  })

  // capire come prendere le info che abbiamo sul db della mod X e vedere se c'è una differenza per notificarla
  // fare i comandi per il bot(che siano autocompletabili da discord),
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
