import { NamedNode } from 'rdflib'

export interface SelectedAddressBookUris {
  addressBookUri: string,
  groupUris: string []
}
export type GroupData = {
  name: string,
  uri: string
}

export type ContactDataFromAddressBook = {
  name: string,
  uri: string
}
export interface AddressBookDetails {
  name: string,
  groups: GroupData[]
  contacts: ContactDataFromAddressBook[]
}

export interface AddressBooksData {
  public: Map<string, AddressBookDetails>,
  private: Map<string, AddressBookDetails>,
  contactWebIDs: Map<string,string> 
  contactNames: Map<string,string>
}

export interface EmailDetails {
  type: NamedNode,
  email: NamedNode
}

export interface PhoneDetails {
  type: NamedNode,
  phoneNumber: NamedNode
}
export interface ContactData {
  name: string,
  nickname?: string,
  preferredSubjectPronoun?: string,
  preferredObjectPronoun?: string,
  preferredRelativePronoun?: string,
  emails?: EmailDetails[],
  phoneNumbers?: PhoneDetails[],
  webID: string
}
