import level from "level"
import { join, resolve } from "path"
import { config } from "../config"

import { DBKeys, IModInfo, IModInfoList, IObservedMod, IObservedModList } from "../types"

// valueEncoding json serve a specificare il nostro encoding nel database,  specifichiamo il formato insomma
export const valheimBotDB = level(resolve(join(config.db.path, config.db.name)), { valueEncoding: "json" })

///* Initialization
export const initLevelDB = async (): Promise<void> => {
  try {
    await valheimBotDB.get(DBKeys.ObservedModList)
  } catch (error) {
    await valheimBotDB.put(DBKeys.ObservedModList, [])
  }

  try {
    await valheimBotDB.get(DBKeys.ModInfoList)
  } catch (error) {
    await valheimBotDB.put(DBKeys.ModInfoList, [])
  }
}

///* DB Methods
/**
 * Saves a new observed mod list
 * @param observedModList The new observed mod list to save
 */
export const putObservedModList = (observedModList: IObservedModList): Promise<void> => {
  return valheimBotDB.put(DBKeys.ObservedModList, observedModList)
}

/**
 * Gets the current observed mod list
 * @returns The current observed mod list
 */
export const getObservedModList = (): Promise<IObservedModList> => {
  return valheimBotDB.get(DBKeys.ObservedModList)
}

/**
 * Gets a specific mod
 * @param modId The mod id to find
 * @returns The mod or undefined if not present
 */
export const getObservedModById = async (modId: number): Promise<IObservedMod | undefined> => {
  const mods = await getObservedModList()
  return mods.find((mod) => mod.mod_id === modId)
}

/**
 * Gets the current evaluated observed mod list, called mod info list
 * @returns The current mod info list
 */
export const getModInfoList = (): Promise<IModInfoList> => {
  return valheimBotDB.get(DBKeys.ModInfoList)
}

/**
 * Gets a specific mod info
 * @param modId The mod id to find
 * @returns The mod or undefined if not present
 */
export const getModInfoById = async (modId: number): Promise<IModInfo | undefined> => {
  const mods = await getModInfoList()
  return mods.find((mod) => mod.mod_id === modId)
}

/**
 * Saves a new mod info list
 * @param modInfoList The new mod info list to save
 */
export const putModInfoList = (modInfoList: IModInfoList): Promise<void> => {
  return valheimBotDB.put(DBKeys.ModInfoList, modInfoList)
}
