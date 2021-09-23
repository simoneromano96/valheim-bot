import { getModInfoList, getObservedModList, putModInfoList, putObservedModList } from "../db"
import { IObservedModList } from "../types"

/**
 * Adds a mod to observe
 * @param observeModId The mod to start observing
 * @returns The new list of observed mods
 */
export const observeMod = async (observeModId: number): Promise<IObservedModList> => {
  const observedModList = await getObservedModList()
  const alreadyObservedMod = observedModList.find(({ mod_id }) => observeModId === mod_id)
  if (!alreadyObservedMod) {
    observedModList.push({ mod_id: observeModId })
    await putObservedModList(observedModList)
  }
  return observedModList
}

/**
 * Stops observing a mod
 * @param modId The mod id to stop observing
 * @returns The new list of observed mods
 */
export const stopObserveMod = async (modId: number): Promise<IObservedModList> => {
  const mods = await getObservedModList()
  const filteredMods = mods.filter((mod) => mod.mod_id !== modId)
  await putObservedModList(filteredMods)
  const modInfoList = await getModInfoList()
  const filteredModInfoList = modInfoList.filter((mod) => mod.mod_id !== modId)
  await putModInfoList(filteredModInfoList)
  return filteredMods
}
