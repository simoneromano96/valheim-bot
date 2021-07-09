import { Static, Type } from "@sinclair/typebox"

// Schemas
export const ObserveMod = Type.Object({
  id: Type.Number(),
})

export type IObserveMod = Static<typeof ObserveMod>

export const ObservedMod = Type.Object({
  mod_id: Type.Number(),
})

export type IObservedMod = Static<typeof ObservedMod>

export const ObservedModList = Type.Array(ObservedMod)

export type IObservedModList = Static<typeof ObservedModList>

// others
export enum DBKeys {
  // The observed mod list
  OBSERVED_MOD_LIST = "OBSERVED_MOD_LIST",
  // The valuated mod list
  MOD_INFO_LIST = "MOD_LIST",
}
