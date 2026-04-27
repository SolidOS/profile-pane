import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './styles/ProfileLayout.css'
import './styles/CollapsibleSection.css'
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
import { SocialPresentation } from './sections/social/types'
import { renderQRCode } from './sections/qrcode/QRCodeSection'

function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

function renderSidebar(
  store: LiveStore,
  subject: NamedNode,
  accounts: SocialPresentation,
  skills: SkillDetails[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <aside 
      aria-labelledby="sidebar-heading" 
      class="profile__sidebar p-sm" 
    >
      <h2 id="sidebar-heading" class="sr-only">Sidebar</h2>
      <div aria-label="Sidebar Content" class="flex-column gap-md">
        ${renderSocialAccounts(store, subject, accounts, viewerMode, onSaved)}
        ${renderSkillsSection(store, subject, skills, viewerMode, onSaved)}
        ${renderLanguageSection(store, subject, languages, viewerMode, onSaved)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode, onSaved)}
        ${renderQRCode(subject, store)}
      </div>
    </aside>
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
    <div class="profile-pane-root">
      <main
        id="main-content"
        class="profile-grid"
        tabindex="-1"
      > 
        <h1 id="profile-content-heading" class="sr-only">Profile for ${profileDetails.name}</h1>

        <section
          class="profile__main flex-column gap-md p-sm"
          >
          <h2 id="profile-main-heading" class="sr-only">Main Profile Content</h2>

          ${renderHeadingSection(context, subject, profileDetails, viewerMode, onSaved)}
          ${renderBioSection(store, subject, bioDetails, viewerMode, onSaved)}
          ${renderCVSection(store, subject, rolesByType, viewerMode, onSaved)}
          ${renderProjectSection(store, subject, projects, viewerMode, onSaved)}
          
        </section>
        ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, viewerMode, onSaved)}
      </main>
    </div>
  `
}
