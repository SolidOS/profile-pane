import { Node } from 'rdflib'
import type { AddressDetails, PointDetails } from '../contactInfo/types'

export interface ProfilePresentation {
  name: string;
  nickname?: string;
  imageSrc?: string;
  location?: string;
  pronouns?: string;
  dateOfBirth?: string;
  jobTitle?: string;
  primaryPhone?: PointDetails;
  primaryEmail?: PointDetails;
  primaryAddress?: AddressDetails;
}

export interface ProfileDetails extends ProfilePresentation {
  entryNode: Node
}
