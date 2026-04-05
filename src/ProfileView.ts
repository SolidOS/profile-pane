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
import { ContactInfo } from './sections/contactInfo/types'
import { LanguageDetails } from './sections/languages/types'
import { renderCVSection } from './sections/resume/ResumeSection'
import { renderEducationSection } from './sections/education/EducationSection'
import { renderProjectSection } from './sections/projects/ProjectSection'
import { renderIntroSection } from './sections/intro/IntroSection'
import { renderBioSection } from './sections/bio/BioSection'
import { renderSocialAccounts } from './sections/social/SocialSection'

type ProfileViewModelData = ReturnType<typeof presentProfileViewModel>
type ProfileDetails = ProfileViewModelData['profileDetails']
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
  skills: string[],
  languages: LanguageDetails[],
  contactInfo: ContactInfo,
  profileDetails: ProfileDetails,
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
        ${renderSocialAccounts(store, subject, accounts, viewerMode)}
        ${renderSkillsSection(store, subject, skills, viewerMode)}
        ${renderLanguageSection(store, subject, languages, viewerMode)}
        ${renderContactInfoSection(store, subject, contactInfo, viewerMode)}
        ${renderQRCode(subject)}
      </div>
    </aside>
  `
}

function renderQRCode(subject: NamedNode) {
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

  const viewModel = presentProfileViewModel(subject, store)
  const profileDetails = viewModel.profileDetails
  const rolesByType = viewModel.cvDetails
  const skills = viewModel.skills
  const languages = viewModel.languages
  const education = viewModel.education
  const projects = viewModel.projects
  const bioDetails = viewModel.bioDetails
  const accounts = viewModel.social
  const contactInfo = viewModel.contactInfo
  
  return html` 
    <main
      id="main-content"
      class="profile-grid"
      role="main"
      aria-label="Profile for ${profileDetails.name}"
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
          ${renderIntroSection(context, subject, profileDetails, viewerMode)}
        </article>

        ${renderBioSection(store, subject, bioDetails, viewerMode)}
        ${renderCVSection(store, subject, rolesByType, viewerMode)}
        ${renderProjectSection(store, subject, projects, viewerMode)}
        ${renderEducationSection(store, subject, education, viewerMode)}
      </section>
      ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, profileDetails, viewerMode)}
    </main>
  `
}
