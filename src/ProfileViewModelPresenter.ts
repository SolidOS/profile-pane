import { NamedNode } from 'rdflib'
import { solidLogicSingleton } from 'solid-logic'
import { ContactInfo  } from './sections/contactInfo/types'
import { SocialPresentation } from './sections/social/types'
import { resolveSocialPresentationIcon } from './sections/social/helpers'
import { SkillDetails } from './sections/skills/types'
import { LanguageDetails } from './sections/languages/types'
import { RoleDetails } from './sections/resume/types'
import { EducationDetails } from './sections/education/types'
import { ProjectDetails } from './sections/projects/types'
import { ProfileDetails } from './sections/heading/types'
import { BioDetails } from './sections/bio/types'

export type ProfileViewModel = {
  profileDetails: ProfileDetails,
  contactInfo: ContactInfo,
  skills: SkillDetails[],
  languages: LanguageDetails[], 
  education: EducationDetails[],
  projects: ProjectDetails[],
  bioDetails: BioDetails,
  social: SocialPresentation,
  cvDetails: RoleDetails[]
}

export async function presentProfileViewModel(subject: NamedNode): Promise<ProfileViewModel> {
  const { profile } = solidLogicSingleton
  const profileDetails = profile.getHeading(subject)
  const contactInfo = profile.getContactInfo(subject)
  const skills = profile.getSkillDetails(subject)
  const languages = profile.getLanguages(subject)
  const education = profile.getEducation(subject)
  const projects = await profile.getProjects(subject)
  const bioDetails = profile.getBio(subject)
  const social: SocialPresentation = {
    accounts: profile.getSocial(subject).accounts.map(account => ({
      ...account,
      icon: resolveSocialPresentationIcon(account.icon)
    }))
  }
  const cvDetails = profile.getResume(subject)

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