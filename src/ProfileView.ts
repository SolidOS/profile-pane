import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './ProfileView.css'
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
import { renderSocialSection } from './sections/social/SocialSection'
import { renderQRCodeSection } from './sections/qrcode/QRCodeSection'

function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

function renderSidebar(
  store: LiveStore,
  subject: NamedNode,
  skills: SkillDetails[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <div 
      aria-labelledby="sidebar-heading" 
      class="profile__sidebar" 
    >
      <h2 id="sidebar-heading" class="sr-only">Sidebar</h2>
      <div class="profile__sidebar-content">
        ${renderSkillsSection(store, subject, skills, viewerMode, onSaved)}
        ${renderLanguageSection(store, subject, languages, viewerMode, onSaved)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode, onSaved)}
        ${renderQRCodeSection(subject, store)}
      </div>
    </div>
  `
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext,
  onSaved?: () => Promise<void> | void
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)
  const layout = context.environment?.layout ?? 'desktop'
  const theme = context.environment?.theme ?? 'light'
  const inputMode = context.environment?.inputMode ?? 'pointer'

  const viewModel = await presentProfileViewModel(subject, store)
  const profileDetails = viewModel.profileDetails
  const rolesByType = viewModel.cvDetails
  const skills = viewModel.skills
  const languages = viewModel.languages
  const projects = viewModel.projects
  const bioDetails = viewModel.bioDetails
  const accounts = viewModel.social
  const contactInfo = viewModel.contactInfo

  const headingSection = await renderHeadingSection(context, subject, profileDetails, viewerMode, onSaved)
  const bioSection = renderBioSection(store, subject, bioDetails, viewerMode, onSaved)
  const skillsSection = renderSkillsSection(store, subject, skills, viewerMode, onSaved)
  const languageSection = renderLanguageSection(store, subject, languages, viewerMode, onSaved)
  const cvSection = renderCVSection(store, subject, rolesByType, viewerMode, onSaved)
  const projectSection = renderProjectSection(store, subject, projects, viewerMode, onSaved)
  const socialSection = renderSocialSection(store, subject, accounts, viewerMode, onSaved)
  const contactInfoSection = renderContactInfoSection(store, subject, contactInfo, viewerMode, onSaved)
  const qrCodeSection = renderQRCodeSection(subject, store)

  if (layout === 'mobile') {
    return html`
      <div
        class="profile-pane-root"
        data-layout=${layout}
        data-theme=${theme}
        data-input-mode=${inputMode}
      >
        <main
          id="main-content"
          class="profile-grid"
          tabindex="-1"
        >
          <h1 id="profile-content-heading" class="sr-only">Profile for ${profileDetails.name}</h1>
          <h2 id="profile-main-heading" class="sr-only">Main Profile Content</h2>

          ${headingSection}
          ${bioSection}
          ${skillsSection}
          ${languageSection}
          ${cvSection}
          ${projectSection}
          ${socialSection}
          ${contactInfoSection}
          ${qrCodeSection}
        </main>
      </div>
    `
  }
  
  return html` 
    <div
      class="profile-pane-root"
      data-layout=${layout}
      data-theme=${theme}
      data-input-mode=${inputMode}
    >
      <div
        id="main-content"
        class="profile-grid"
        tabindex="-1"
      > 
        <div class="profile__intro-main">
          ${headingSection}
        </div>

        <div class="profile__intro-sidebar profile__sidebar">
          ${socialSection}
        </div>

        ${renderSidebar(store, subject, skills, languages, contactInfo, viewerMode, onSaved)}

        <section class="profile__main">
          <h2 id="profile-main-heading" class="sr-only">Main Profile Content</h2>

          ${bioSection}
          ${cvSection}
          ${projectSection}
          
        </section>       
      </div>
    </div>
  `
}
