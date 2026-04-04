import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './styles/ProfileView.css'
import { ProfileCard } from './ProfileCard'
import { SocialCard } from './SocialCard'
import { QRCodeCard } from './QRCodeCard'
import {
  socialAccountsHeadingText,
} from './texts'
import { ViewerMode } from './types'
import { selectProfileViewModel } from './ProfileViewModelSelector'
import { renderContactInfoSection } from './sections/contactInfo/ContactInfoSection'
import { renderLanguageSection } from './sections/languages/LanguageSection'
import { renderSkillsSection } from './sections/skills/SkillsSection'
import { ContactInfo } from './sections/contactInfo/types'
import { LanguageDetails } from './sections/languages/types'
import { renderCVSection } from './sections/resume/ResumeSection'

type ProfileViewModelData = ReturnType<typeof selectProfileViewModel>
type ProfileBasics = ProfileViewModelData['basics']
type SocialAccounts = ProfileViewModelData['social']

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

function renderSidebar(
  store: LiveStore,
  subject: NamedNode,
  accounts: SocialAccounts,
  skills: string[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo,
  profileBasics: ProfileBasics,
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
        ${renderSkillsSection(store, subject, skills, viewerMode)}
        ${renderLanguageSection(store, subject, languages, viewerMode)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode)}
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
  const contactInfo = viewModel.contactInfo
  console.log('Contact Info', JSON.stringify(contactInfo))
  
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

        ${renderCVSection(store, subject, rolesByType, viewerMode)}
      </section>
      ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, profileBasics, viewerMode)}
    </main>
  `
}
