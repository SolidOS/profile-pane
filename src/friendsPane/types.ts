import { NamedNode } from 'rdflib'

export interface ProfileDetails {
  url: string
  imageUrl?: string
  name?: string
  nickname?: string
  jobTitle?: string
  organization?: string
  location?: string
  pronouns?: string
  birthdate?: string
}

export interface FriendDetails extends ProfileDetails {
  subjectNode: NamedNode
}
