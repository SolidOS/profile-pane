import { NamedNode } from "rdflib"

export interface EmailDetails {
  type: NamedNode,
  email: NamedNode
}

export interface PhoneDetails {
  type: NamedNode,
  phoneNumber: NamedNode
}

export interface AddressDetails {
  type?: NamedNode,
  fullAddress?: string,
  streetAddress?: string,
  locality?: string,
  region?: string,
  postalCode?: string,
  countryName?: string
}

export interface ContactDetails {
  emails: EmailDetails[],
  phones: PhoneDetails[],
  addresses: AddressDetails[]
}
