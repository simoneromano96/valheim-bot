// Node
import { createWriteStream } from "fs"
import { join, resolve, extname } from "path"

// External libraries
import got from "got"
import pMap from "p-map"
// This is compiled as a cjs module
import { default as nexusApiImport, IFileInfo, IModFiles } from "@nexusmods/nexus-api"
import { Job, Queue, QueueScheduler, Worker } from "bullmq"

import { config } from "../config"
import { getModInfoList, getObservedModList, putModInfoList } from "../db"
import { IModInfo } from "../types"
import { pipeline } from "./index"
import { logger } from "../logger"

const nexusConfig = config.nexus

const nexusApi = nexusApiImport as unknown as { default: typeof nexusApiImport }

const getLatestFileInfo = (modFiles: IModFiles): IFileInfo => {
  let maxUploadedTimestamp = 0
  let latestFileInfo: IFileInfo
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
  return latestFileInfo
}

/**
 * Initialize nexus worker
 */
export async function initWorker(): Promise<void> {
  logger.info("Initializing nexus worker")
  const nexusClient = await nexusApi.default.create(nexusConfig.apiToken, "Valheim", "0.0.0", nexusConfig.gameId)

  new QueueScheduler("modsQueue", { connection: { host: config.redis.hostname } })
  const processModsQueue = new Queue("modsQueue", { connection: { host: config.redis.hostname } })

  await processModsQueue.add("evaluateModListJob", null, {
    delay: 0,
    repeat: {
      // 1000ms -> 60s -> 60m -> 1h
      every: 1000 * 60 * 60 * 1,
    },
  })

  //QUESTO È IL JOB LOL
  const worker = new Worker(
    processModsQueue.name,
    async (job) => {
      logger.info(`Started evaluateModListJob: ${job.id}`)
      // Get currently observed mod list
      const observedModList = await getObservedModList()
      // Fetch the mod info list
      const modInfoList = await pMap(observedModList, ({ mod_id: modId }) => nexusClient.getModInfo(modId, nexusConfig.gameId), {
        concurrency: 10,
      })
      // Get the current mod info list
      const prevModInfoList = await getModInfoList()
      const updatedModInfoList = await pMap(
        modInfoList,
        async (modInfo) => {
          try {
            // Get saved mod info
            const prevModInfo = prevModInfoList.find((mod) => mod.mod_id === modInfo.mod_id)
            // Check if timestamps are different. If true = aggiornamento.
            if (true || modInfo.updated_timestamp !== prevModInfo?.updated_timestamp) {
              logger.info(`The ${modInfo.name ?? modInfo.mod_id} mod has been updated!`)
              // Get mod Files
              const modFiles = await nexusClient.getModFiles(modInfo.mod_id, modInfo.domain_name)
              const latestFileInfo = getLatestFileInfo(modFiles)
              // prendiamo i link per scaricare
              const downloadURLs = await nexusClient.getDownloadURLs(modInfo.mod_id, latestFileInfo.file_id, undefined, undefined, modInfo.domain_name)
              // prendo il primo url (CDN)
              const cdnDownloadURI = downloadURLs[0].URI
              // Get file extension
              const extension = extname(latestFileInfo.file_name)
              // Compose fileName (still unsure if this is ok)
              const fileName = `${modInfo.game_id}-${modInfo.mod_id}${extension}`
              // local file path
              const localFilePath = join(resolve(config.static.localPath), fileName)
              // è un flusso di dati la cui fonte è il download URI, la destinazione è il nostro file system :)
              await pipeline(got.stream(cdnDownloadURI), createWriteStream(localFilePath))
              // Create download URL
              const url = new URL(`${config.server.protocol}://${config.server.hostname}`)
              url.port = config.server.port
              url.pathname = join(config.static.publicPath, fileName)
              const downloadURL = url.toString()
              // Add downloadURL to modInfo
              return { ...modInfo, downloadURL }
            }
            return prevModInfo
          } catch (error) {
            logger.error(error)
            return modInfo
          }
        },
        { concurrency: 10 },
      )
      // 4. Save in the db
      await putModInfoList(updatedModInfoList)
    },
    { connection: { host: config.redis.hostname } },
  )

  // fare comando !get per prendere il link dal server e POSTARE tipo NOMEMOD: LINK.
  worker.on("completed", (job) => {
    logger.info(`${job.id} has completed!`)
  })

  worker.on("failed", (job: Job, err: Error) => {
    logger.error(`${job.id} has failed with ${err.message}`)
  })

  logger.info("initialized nexus worker")
}
