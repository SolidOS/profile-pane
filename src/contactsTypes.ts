import { NamedNode } from "rdflib/lib/tf-types"

export interface SelectedAddressBookUris {
  addressBookUri: string,
  groupUris: string []
}
export type GroupData = {
  name: string,
  uri: string
}
export interface AddressBookDetails {
  name: string,
  groups: GroupData[]
}

export interface AddressBooksData {
  public: Map<string, AddressBookDetails>,
  private: Map<string, AddressBookDetails>,
  contacts: Map<string,string>
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
    emails?: EmailDetails[],
    phoneNumbers?: PhoneDetails[],
    webID: string
}
