import { NamedNode, LiveStore } from 'rdflib'
import { ContactInfo  } from './sections/contactInfo/types';
import { presentSocial } from './sections/social/selectors';
import { SocialPresentation } from './sections/social/types';
import { presentSkills } from './sections/skills/selectors';
import { presentLanguages } from './sections/languages/selectors';
import { LanguageDetails } from './sections/languages/types';
import { presentCV } from './sections/resume/selectors';
import { RoleDetails } from './sections/resume/types';
import { presentContactInfo } from './sections/contactInfo/selectors';
import { EducationDetails } from './sections/education/types';
import { presentEducation } from './sections/education/selectors';
import { ProjectDetails } from './sections/projects/types';
import { presentProjects } from './sections/projects/selectors';
import { presentProfile } from './sections/intro/selectors';
import { ProfileDetails } from './sections/intro/types'
import { BioDetails } from './sections/bio/types'
import { presentBio } from './sections/bio/selectors'

export type ProfileViewModel = {
  profileDetails: ProfileDetails,
  contactInfo: ContactInfo,
  skills: string[],
  languages: LanguageDetails[], 
  education: EducationDetails[],
  projects: ProjectDetails[],
  bioDetails: BioDetails,
  social: SocialPresentation,
  cvDetails: RoleDetails[]
}

export function presentProfileViewModel(subject: NamedNode, store: LiveStore): ProfileViewModel {
  const profileDetails = presentProfile(subject, store)
  const contactInfo = presentContactInfo(subject, store)
  const skills = presentSkills(subject, store)
  const languages = presentLanguages(subject, store)
  const education = presentEducation(subject, store)
  const projects = presentProjects(subject, store)
  const bioDetails = presentBio(subject, store)
  const social = presentSocial(subject, store)
  const cvDetails = presentCV(subject, store)

  return { 
    profileDetails,
    social,
    contactInfo,
    skills, 
    languages,
    education,
    projects,
    bioDetails,
    cvDetails
  }
}