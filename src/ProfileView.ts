import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './ProfileView.css'
import './styles/CollapsibleSection.css'
import { Layout, ViewerMode } from './types'
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
  const currentUser = authn.currentUser()
  const sameTerm = currentUser ? currentUser.sameTerm(subject) : false

  if (currentUser && sameTerm) mode = 'owner'
  if (currentUser && !sameTerm) mode = 'authenticated'
  return mode
}

function renderSidebar(
  store: LiveStore,
  subject: NamedNode,
  accounts,
  skills: SkillDetails[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo, 
  viewerMode: ViewerMode,
  layout: Layout,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <div
      class="profile__sidebar"
    >
      <aside class="profile__sidebar-content" aria-labelledby="profile-sidebar-heading">
        <h2 id="profile-sidebar-heading" class="sr-only">Profile sidebar</h2>
        ${renderSocialSection(store, subject, accounts, viewerMode, layout, onSaved)}
        ${renderSkillsSection(store, subject, skills, viewerMode, layout, onSaved)}
        ${renderLanguageSection(store, subject, languages, viewerMode, layout, onSaved)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode, layout, onSaved)}
        ${renderQRCodeSection(subject, store)}
      </aside>
    </div>
  `
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext,
  layout: Layout,
  onSaved?: () => Promise<void> | void
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)
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

  const headingSection = await renderHeadingSection(context, subject, profileDetails, viewerMode, layout,onSaved)
  const bioSection = renderBioSection(store, subject, bioDetails, viewerMode, layout, onSaved)
  const skillsSection = renderSkillsSection(store, subject, skills, viewerMode, layout, onSaved)
  const languageSection = renderLanguageSection(store, subject, languages, viewerMode, layout, onSaved)
  const cvSection = renderCVSection(store, subject, rolesByType, viewerMode, layout, onSaved)
  const projectSection = renderProjectSection(store, subject, projects, viewerMode, layout, onSaved)
  const socialSection = renderSocialSection(store, subject, accounts, viewerMode, layout, onSaved)
  const contactInfoSection = renderContactInfoSection(store, subject, contactInfo, viewerMode, layout, onSaved)
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

        <section class="profile__main">
          ${headingSection}
          ${bioSection}
          ${cvSection}
          ${projectSection}

        </section>
        ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, viewerMode, layout, onSaved)}
      </div>
    </div>
  `
}
