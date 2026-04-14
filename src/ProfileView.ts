import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './styles/ProfileView.css'
import { QRCodeCard } from './QRCodeCard'
import { ViewerMode } from './types'
import { presentProfileViewModel } from './ProfileViewModelPresenter'
import { renderContactInfoSection } from './sections/contactInfo/ContactInfoSection'
import { renderLanguageSection } from './sections/languages/LanguageSection'
import { renderSkillsSection } from './sections/skills/SkillsSection'
import { SkillDetails } from './sections/skills/types'
import { ContactInfo } from './sections/contactInfo/types'
import { LanguageDetails } from './sections/languages/types'
import { renderCVSection } from './sections/resume/ResumeSection'
import { renderProjectSection } from './sections/projects/ProjectSection'
import { renderHeadingSection } from './sections/heading/HeadingSection'
import { renderBioSection } from './sections/bio/BioSection'
import { renderSocialAccounts } from './sections/social/SocialSection'

type ProfileViewModelData = Awaited<ReturnType<typeof presentProfileViewModel>>
type SocialAccounts = ProfileViewModelData['social']

function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

function renderSidebar(
  store: LiveStore,
  subject: NamedNode,
  accounts: SocialAccounts,
  skills: SkillDetails[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <aside 
      aria-labelledby="sidebar-heading" 
      class="profile__sidebar section-bg" 
    >
      <h2 id="sidebar-heading" class="sr-only">Sidebar</h2>
      <div aria-label="Sidebar Content">
        ${renderSocialAccounts(store, subject, accounts, viewerMode, onSaved)}
        ${renderSkillsSection(store, subject, skills, viewerMode, onSaved)}
        ${renderLanguageSection(store, subject, languages, viewerMode, onSaved)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode, onSaved)}
        ${renderQRCode(subject, store)}
      </div>
    </aside>
  `
}

function renderQRCode(subject: NamedNode, store: LiveStore) {
  return html`
      <section class="profile__section border-lighter profile__qr-code" aria-labelledby="qr-heading" tabindex="-1">
        <h2 id="qr-heading" class="sr-only">QR code</h2>
        ${QRCodeCard(subject, store)}
      </section>
  `
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext,
  onSaved?: () => Promise<void> | void
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)

  const viewModel = await presentProfileViewModel(subject, store)
  const profileDetails = viewModel.profileDetails
  const rolesByType = viewModel.cvDetails
  const skills = viewModel.skills
  const languages = viewModel.languages
  const projects = viewModel.projects
  const bioDetails = viewModel.bioDetails
  const accounts = viewModel.social
  const contactInfo = viewModel.contactInfo
  
  return html` 
    <main
      id="main-content"
      class="profile-grid"
      tabindex="-1"
    > 
      <h1 id="profile-content-heading" class="sr-only">Profile for ${profileDetails.name}</h1>

      <section
        class="profile__main section-bg flex-column gap-md p-md"
        >
        <h2 id="profile-main-heading" class="sr-only">Main Profile Content</h2>

        ${renderHeadingSection(context, subject, profileDetails, viewerMode, onSaved)}
        ${renderBioSection(store, subject, bioDetails, viewerMode, onSaved)}
        ${renderCVSection(store, subject, rolesByType, viewerMode, onSaved)}
        ${renderProjectSection(store, subject, projects, viewerMode, onSaved)}
        
      </section>
      ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, viewerMode, onSaved)}
    </main>
  `
}
