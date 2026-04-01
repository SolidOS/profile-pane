import { NamedNode, LiveStore } from 'rdflib'
import { presentProfile, ProfilePresentation } from './presenter';
import { ContactDetails, selectContactDetails } from './ContactDetailsPresenter';
import { presentSocial, SocialPresentation } from './SocialPresenter';
import { selectSkills } from './SkillsPresenter';
import { selectLanguages } from './LanguagePresenter';
import { CVPresentation, presentCV } from './CVPresenter';

export type ProfileViewModel = {
  basics: ProfilePresentation,
  contact: ContactDetails,
  skills: string[],
  languages: string[], 
  social: SocialPresentation,
  cvDetails: CVPresentation
}

export function selectProfileViewModel(subject: NamedNode, store: LiveStore): ProfileViewModel {
  const basics = presentProfile(subject, store)
  const contact = selectContactDetails(subject, store)
  const skills = selectSkills(subject, store)
  const languages = selectLanguages(subject, store)
  const social = presentSocial(subject, store)
  const cvDetails = presentCV(subject, store)

  return { 
    basics,
    social,
    contact,
    skills, 
    languages,
    cvDetails
  }
}