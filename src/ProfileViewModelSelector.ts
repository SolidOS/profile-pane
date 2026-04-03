import { NamedNode, LiveStore } from 'rdflib'
import { presentProfile, ProfilePresentation } from './presenter';
import { ContactInfo  } from './sections/contactInfo/types';
import { presentSocial, SocialPresentation } from './SocialPresenter';
import { selectSkills } from './SkillsPresenter';
import { selectLanguages } from './LanguagePresenter';
import { CVPresentation, presentCV } from './CVPresenter';
import { selectContactInfo } from './sections/contactInfo/selectors';

export type ProfileViewModel = {
  basics: ProfilePresentation,
  contactInfo: ContactInfo,
  skills: string[],
  languages: string[], 
  social: SocialPresentation,
  cvDetails: CVPresentation
}

export function selectProfileViewModel(subject: NamedNode, store: LiveStore): ProfileViewModel {
  const basics = presentProfile(subject, store)
  const contactInfo = selectContactInfo(subject, store)
  const skills = selectSkills(subject, store)
  const languages = selectLanguages(subject, store)
  const social = presentSocial(subject, store)
  const cvDetails = presentCV(subject, store)

  return { 
    basics,
    social,
    contactInfo,
    skills, 
    languages,
    cvDetails
  }
}