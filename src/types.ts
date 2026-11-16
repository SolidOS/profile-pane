import type { Node } from 'rdflib'
import type { AddressDetails, PointDetails } from './sections/contactInfo/types'

export type ViewerMode = 'owner' | 'authenticated' | 'anonymous'

export type Layout = 'mobile' | 'desktop'

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
