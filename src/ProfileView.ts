import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './styles/ProfileView.css'
import { presentCV } from './CVPresenter' // 20210527// 20210527
import { ProfileCard } from './ProfileCard'
import { CVCard } from './CVCard'
import { SocialCard } from './SocialCard'
import { QRCodeCard } from './QRCodeCard'
import {
  resumeHeadingText,
  socialAccountsHeadingText,
} from './texts'
import { ViewerMode } from './types'
import { strToUpperCase } from './textUtils'
import { selectProfileViewModel } from './ProfileViewModelSelector'
import { ContactDetails } from './ContactDetailsPresenter'

type ProfileViewModelData = ReturnType<typeof selectProfileViewModel>
type ProfileBasics = ProfileViewModelData['basics']
type SocialAccounts = ProfileViewModelData['social']
type ProfileDetails = Pick<ProfileViewModelData, 'skills' | 'languages'>


function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

function renderSocialAccounts(accounts: SocialAccounts, viewerMode: ViewerMode) {
   return accounts.accounts && accounts.accounts.length > 0 ? html`
        <section 
          aria-labelledby="social-heading" 
          class="section-bg" 
          role="complementary"
          tabindex="-1"
        >
          <header class="mb-md">
            <h3 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h3>
          </header>
          <nav aria-label="Social media links">
            ${SocialCard(accounts, viewerMode)}
          </nav>
        </section>
      ` : ''
}

function renderCVSection(rolesByType, viewerMode: ViewerMode) {
  const cv = CVCard(rolesByType, viewerMode)
  return cv && cv.strings && cv.strings.join('').trim() !== '' ? html`
    <section 
      aria-labelledby="cv-heading" 
      class="section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="mb-md">
        <h3 id="cv-heading" tabindex="-1">${resumeHeadingText}</h3>
      </header>
      <div>
        ${cv}
      </div>
    </section>
  ` : ''
}

function renderSidebar(
  accounts: SocialAccounts,
  skills: string[],
  languages: string[],
  contactDetails: ContactDetails,
  profileBasics: ProfileBasics,
  subject: NamedNode,
  viewerMode: ViewerMode
) {
  return html`
    <aside 
      aria-labelledby="sidebar-heading" 
      class="profileSidebar section-bg" 
      role="complementary"
      tabindex="-1"
    >
      <header class="sr-only">
        <h2 id="sidebar-heading" tabindex="-1">Sidebar</h2>
      </header>
      <div aria-label="Sidebar Content">
        ${renderSocialAccounts(accounts, viewerMode)}
        ${renderSkillsSection(skills)}
        ${renderLanguageSection(languages)}
        ${renderContactDetailsSection(contactDetails, viewerMode)}
        ${renderQRCode(profileBasics, subject)}
      </div>
    </aside>
  `
}

function renderQRCode(profileBasics: ProfileBasics, subject: NamedNode) {
  return html`
      <div class="qrCodeSection section-centered">
        ${QRCodeCard(subject)}
      </div>
  `
}

function renderSkill(skill, asList = false) {
  if (!skill) return html``
  return asList
    ? html`<li class="skill">${strToUpperCase(skill)}</li>`
    : html``
}

function renderSkills(skills, asList = false) {
  if (!skills || !skills.length || !skills[0]) return html``
  return html`${renderSkill(skills[0], asList)}${skills.length > 1 ? renderSkills(skills.slice(1), asList) : html``}`
}

function renderSkillsSection(skills: string[]) {
  const skillsArr = skills || []
  const hasSkills = Array.isArray(skillsArr) && skillsArr.length > 0

  return hasSkills ? html`
    <section class="section-bg" aria-labelledby="skills-heading">
    <header class="mb-md">
      <h3 id="skills-heading">Skills</h3>
      <ul role="list" aria-label="Professional skills and competencies">
        ${renderSkills(skillsArr, true)}
      </ul>
    </section>
  ` : ''
}

function renderLan(language, asList = false) {
  if (!language) return html``
  return asList
    ? html`<li class="language">${language}</li>`
    : html``
}

function renderLanguages(languages, asList = false) {
  if (!languages || !languages.length || !languages[0]) return html``
  return html`${renderLan(languages[0], asList)}${languages.length > 1 ? renderLanguages(languages.slice(1), asList) : html``}`
}

function renderLanguageSection(languages: string[]) {
  const languagesArr = languages || []
  const hasLanguages = Array.isArray(languagesArr) && languagesArr.length > 0

  return hasLanguages ? html`
    <section class="section-bg" aria-labelledby="languages-heading">
      <header class="mb-md">
        <h3 id="languages-heading">Languages</h3>
      </header>
      <ul role="list" aria-label="Known languages">
        ${renderLanguages(languagesArr, true)}
      </ul>
    </section>
  ` : ''
}

function renderPhone(phone, asList = false) {
  if (!phone) return html``
  const rawPhoneValue = phone.phoneNumber?.value || phone.value || ''
  const phoneValue = rawPhoneValue.replace(/^tel:/i, '')
  const rawType = phone.type?.value || ''
  const phoneType = rawType ? rawType.split('#').pop()?.split('/').pop() : ''
  return asList
    ? html`<li class="phone">
        ${phoneValue}
        ${phoneType ? html`<span class="phone-type"> (${phoneType})</span>` : html``}
      </li>`
    : html``
}

function renderPhones(phones, asList = false) {
  if (!phones || !phones.length || !phones[0]) return html``
  return html`${renderPhone(phones[0], asList)}${phones.length > 1 ? renderPhones(phones.slice(1), asList) : html``}`
}


function renderAddress(address, asList = false) {
  if (!address) return html``
  const pieces = [
    address.fullAddress?.value || address.fullAddress,
    address.streetAddress?.value || address.streetAddress,
    address.locality?.value || address.locality,
    address.region?.value || address.region,
    address.postalCode?.value || address.postalCode,
    address.countryName?.value || address.countryName,
  ].filter(Boolean)
  const formattedAddress = pieces.join(', ')
  return asList
    ? html`<li class="address">${formattedAddress}</li>`
    : html``
}

function renderAddresses(addresses, asList = false) {
  if (!addresses || !addresses.length || !addresses[0]) return html``
  return html`${renderAddress(addresses[0], asList)}${addresses.length > 1 ? renderAddresses(addresses.slice(1), asList) : html``}`
}

function renderContactDetailsSection(contactDetails, viewerMode: ViewerMode) {
  return contactDetails && (contactDetails.emails.length > 0 || contactDetails.phones.length > 0 || contactDetails.addresses.length > 0) ? html`
    <section
      aria-labelledby="contact-details-heading"
      class="section-bg"
      role="region"
      tabindex="-1"
    >
      <header class="mb-md">
        <h3 id="contact-details-heading" tabindex="-1">Contact Info</h3>
      </header>
      <div>
        ${renderPhones(contactDetails.phones, true)}
        ${renderAddresses(contactDetails.addresses, true)}
      </div>
    </section>
  ` : ''
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)

  const viewModel = selectProfileViewModel(subject, store)
  const profileBasics = viewModel.basics
  const rolesByType = viewModel.cvDetails
  const skills = viewModel.skills
  const languages = viewModel.languages
  const accounts = viewModel.social
  const contactDetails = viewModel.contactDetails
  console.log('Contact Details', JSON.stringify(contactDetails))
  
  return html` 
    <main
      id="main-content"
      class="profile-grid"
      style="--profile-grid-bg: radial-gradient(circle, ${profileBasics.backgroundColor} 80%, ${profileBasics.highlightColor} 100%)"
      role="main"
      aria-label="Profile for ${profileBasics.name}"
      tabindex="-1"
    > 
      <section
        class="profileSection section-bg"
        role="region"
        aria-labelledby="profile-content-heading"
        >
        <h2 id="profile-content-heading" class="sr-only">Profile content</h2>
        <article 
          aria-labelledby="profile-card-heading" 
          class="section-bg" 
          role="region"
          tabindex="-1"
        >
          <header class="text-center mb-md">
            <h2 id="profile-card-heading" tabindex="-1">${profileBasics.name}</h2>
          </header>
          ${ProfileCard(profileBasics, context, subject, viewerMode)}
        </article>

        ${renderCVSection(rolesByType, viewerMode)}
      </section>
      ${renderSidebar(accounts, skills, languages, contactDetails, profileBasics, subject, viewerMode)}
    </main>
  `
}
