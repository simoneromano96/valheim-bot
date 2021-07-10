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

/*
export declare type ModStatus =
  | "under_moderation"
  | "published"
  | "not_published"
  | "publish_with_game"
  | "removed"
  | "wastebinned"
  | "hidden"
export declare type EndorsedStatus = "Undecided" | "Abstained" | "Endorsed"
export interface IUser {
  member_id: number
  member_group_id: number
  name: string
}

export interface IModInfo {
  mod_id: number
  game_id: number
  domain_name: string
  category_id: number
  contains_adult_content: boolean
  name?: string
  summary?: string
  description?: string
  version: string
  author: string
  user: IUser
  uploaded_by: string
  uploaded_users_profile_url: string
  status: ModStatus
  available: boolean
  picture_url?: string
  created_timestamp: number
  created_time: string
  updated_timestamp: number
  updated_time: string
  allow_rating: boolean
  endorsement_count: number
  endorsement?: {
    endorse_status: EndorsedStatus
    timestamp: number
    version: number
  }
}
*/

export const ModInfo = Type.Object({
  mod_id: Type.Number(),
  game_id: Type.Number(),
  domain_name: Type.String(),
  category_id: Type.Number(),
})

export type IModInfo = Static<typeof ModInfo>

export const ModInfoList = Type.Array(ModInfo)

export type IModInfoList = Static<typeof ModInfoList>

// others
export enum DBKeys {
  // The observed mod list
  OBSERVED_MOD_LIST = "OBSERVED_MOD_LIST",
  // The valuated mod list
  MOD_INFO_LIST = "MOD_LIST",
}
