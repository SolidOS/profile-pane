import { NamedNode, LiveStore } from 'rdflib'
import { presentProfile, ProfilePresentation } from './presenter';
import { ContactInfo  } from './sections/contactInfo/types';
import { presentSocial, SocialPresentation } from './SocialPresenter';
import { presentSkills } from './sections/skills/selectors';
import { presentLanguages } from './sections/languages/selectors';
import { LanguageDetails } from './sections/languages/types';
import { presentCV } from './sections/resume/selectors';
import { RoleDetails } from './sections/resume/types';
import { presentContactInfo } from './sections/contactInfo/selectors';
import { EducationDetails } from './sections/education/types';
import { presentEducation } from './sections/education/selectors';

export type ProfileViewModel = {
  basics: ProfilePresentation,
  contactInfo: ContactInfo,
  skills: string[],
  languages: LanguageDetails[], 
  education: EducationDetails[],
  social: SocialPresentation,
  cvDetails: RoleDetails[]
}

export function presentProfileViewModel(subject: NamedNode, store: LiveStore): ProfileViewModel {
  const basics = presentProfile(subject, store)
  const contactInfo = presentContactInfo(subject, store)
  const skills = presentSkills(subject, store)
  const languages = presentLanguages(subject, store)
  const education = presentEducation(subject, store)
  const social = presentSocial(subject, store)
  const cvDetails = presentCV(subject, store)

  return { 
    basics,
    social,
    contactInfo,
    skills, 
    languages,
    education,
    cvDetails
  }
}