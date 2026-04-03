import { Node } from "rdflib"
/* using Node instead of NamedNode because the data could
also be a blank node because it's coming from user-edited profile data */
export interface EmailDetails {
  entryNode: Node,
  type: Node,
  valueNode: Node
}

export interface PhoneDetails {
  entryNode: Node,
  type: Node,
  valueNode: Node
}

export interface AddressDetails {
  entryNode: Node,
  type?: Node,
  streetAddress?: string,
  locality?: string,
  region?: string,
  postalCode?: string,
  countryName?: string
}

export interface ContactInfo {
  emails: EmailDetails[],
  phones: PhoneDetails[],
  addresses: AddressDetails[]
}

export type ContactRowStatus = 'existing' | 'new' | 'modified' | 'deleted'

export type ContactPointRow = {
  value: string
  type: string
  entryNode: string
  status: ContactRowStatus
}

export type ContactAddressRow = {
  streetAddress?: string,
  locality?: string,
  region?: string,
  postalCode?: string,
  countryName?: string
  type: string
  entryNode: string
  status: ContactRowStatus
}

export type MutationOps<T> = {
  create: T[]
  update: T[]
  remove: T[]
}

export type ContactMutationPlan = {
  phoneOps: MutationOps<ContactPointRow>
  emailOps: MutationOps<ContactPointRow>
  addressOps: MutationOps<ContactAddressRow>
}
