import level from "level"
import { DBKeys } from "../types"

// valueEncoding json serve a specificare il nostro encoding nel database,  specifichiamo il formato insomma
export const valheimBotDB = level("valheim-bot-db", { valueEncoding: "json" })

export const initLevelDB = async (): Promise<void> => {
  try {
    await valheimBotDB.get(DBKeys.OBSERVED_MOD_LIST)
  } catch (error) {
    await valheimBotDB.put(DBKeys.OBSERVED_MOD_LIST, [])
  }

  try {
    await valheimBotDB.get(DBKeys.MOD_INFO_LIST)
  } catch (error) {
    await valheimBotDB.put(DBKeys.MOD_INFO_LIST, [])
  }
}
