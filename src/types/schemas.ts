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

export const User = Type.Object({
  member_id: Type.Number(),
  member_group_id: Type.Number(),
  name: Type.String(),
})

enum ModStatus {
  UNDER_MODERATION = "under_moderation",
  PUBLISHED = "published",
  NOT_PUBLISHED = "not_published",
  PUBLISHED_WITH_GAME = "publish_with_game",
  REMOVED = "removed",
  WASTEBINNED = "wastebinned",
  HIDDEN = "hidden",
}

enum EndorsedStatus {
  UNDECIDED = "Undecided",
  ABSTAINED = "Abstained",
  ENDORSED = "Endorsed",
}

export const ModInfo = Type.Object({
  mod_id: Type.Number(),
  game_id: Type.Number(),
  domain_name: Type.String(),
  category_id: Type.Number(),
  contains_adult_content: Type.Boolean(),
  name: Type.Optional(Type.String()),
  summary: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
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
    version: Type.Number(),
  }),
})

export type IModInfo = Static<typeof ModInfo>

export const ModInfoList = Type.Array(ModInfo)

export type IModInfoList = Static<typeof ModInfoList>
