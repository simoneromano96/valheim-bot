import {
  ObserveMod,
  IObserveMod,
  ObservedMod,
  IObservedMod,
  ObservedModList,
  IObservedModList,
  ModInfo,
  IModInfo,
  ModInfoList,
  IModInfoList,
} from "./schemas"

// Enum of DB keys
export enum DBKeys {
  // The observed mod list
  ObservedModList = "ObservedModList",
  // The valuated mod list
  ModInfoList = "ModInfoList",
}

export type { IObserveMod, IObservedMod, IObservedModList, IModInfo, IModInfoList }

export { ObserveMod, ObservedMod, ObservedModList, ModInfo, ModInfoList }
