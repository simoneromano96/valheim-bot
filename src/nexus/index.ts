// Node modules
import { promises as streamPromises } from "stream"

import { FastifyPluginCallback } from "fastify"

import { getModInfoById, getModInfoList, getObservedModById } from "../db"
import { IObserveMod, ModInfoList, ObservedModList, ObserveMod } from "../types"
import { observeMod, stopObserveMod } from "./api"
import { initWorker } from "./initWorker"

export const pipeline = streamPromises.pipeline

/**
 * Initializes all APIs for nexus
 */
export const initNexusAPI: FastifyPluginCallback = async (app) => {
  await initWorker()

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
}
