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
export const User = Type.Object({
  member_id: Type.Number(),
  member_group_id: Type.Number(),
  name: Type.String()
})

enum ModStatus {
  UNDER_MODERATION = "under_moderation",
  PUBLISHED = "published",
  NOT_PUBLISHED =  "not_published",
  PUBLISHED_WITH_GAME = "publish_with_game",
  REMOVED = "removed",
  WASTEBINNED = "wastebinned",
  HIDDEN = "hidden"
}
enum EndorsedStatus {
  UNDECIDED = "Undecided", 
  ABSTAINED = "Abstained", 
  ENDORSED = "Endorsed"
}

export const ModInfo = Type.Object({
  mod_id: Type.Number(),
  game_id: Type.Number(),
  domain_name: Type.String(),
  category_id: Type.Number(),
  contains_adult_content: Type.Boolean(),
  name: Type.String(),
  summary: Type.String(),
  description: Type.String(),
  version: Type.String(),
  author: Type.String(),
  user: User,
  uploaded_by: Type.String(),
  uploaded_users_profile_url: Type.String(),
  status: Type.Enum(ModStatus),
  available: Type.Boolean(),
  picture_url: Type.String(),
  created_timestamp: Type.Number(),
  created_time: Type.String(),
  updated_timestamp: Type.Number(),
  updated_time: Type.String(),
  allow_rating: Type.Boolean(),
  endorsement_count: Type.Number(),
  endorsement: Type.Object({
    endorse_status: Type.Enum(EndorsedStatus),
    timestamp: Type.Number(),
    version: Type.Number()
  })
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
