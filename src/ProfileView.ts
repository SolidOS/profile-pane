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
import { renderHeadingSection } from './sections/heading/HeadingSection'
import { renderBioSection } from './sections/bio/BioSection'
import { renderSocialAccounts } from './sections/social/SocialSection'
import { classifyLinkCategory, fetchLinkPreview } from './sections/projects/linkPreview'

type ProfileViewModelData = ReturnType<typeof presentProfileViewModel>
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
        ${renderQRCode(subject)}
      </div>
    </aside>
  `
}

function renderQRCode(subject: NamedNode) {
  return html`
      <section class="profile__qr-code" aria-labelledby="qr-heading">
        <h2 id="qr-heading" class="sr-only">QR code</h2>
        ${QRCodeCard(subject)}
      </section>
  `
}

async function enrichProjectsForDisplay(projects: ProfileViewModelData['projects']) {
  const enriched = await Promise.all(projects.map(async (project) => {
    const url = (project.url || '').trim()
    if (!url) return project

    try {
      const preview = await fetchLinkPreview(url)
      const category = preview.category && preview.category !== 'unknown'
        ? preview.category
        : classifyLinkCategory({
            url: preview.url || project.url,
            title: preview.title || project.title,
            description: preview.description || project.description,
            businessType: preview.businessType || project.businessType
          })

      return {
        ...project,
        title: preview.title || project.title,
        description: preview.description || project.description,
        imageUrl: preview.imageUrl || project.imageUrl,
        businessType: preview.businessType || project.businessType,
        category,
      }
    } catch {
      return {
        ...project,
        category: project.category && project.category !== 'unknown'
          ? project.category
          : classifyLinkCategory({
              url: project.url,
              title: project.title,
              description: project.description,
              businessType: project.businessType
            })
      }
    }
  }))

  return enriched
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext,
  onSaved?: () => Promise<void> | void
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)

  const viewModel = presentProfileViewModel(subject, store)
  const profileDetails = viewModel.profileDetails
  const rolesByType = viewModel.cvDetails
  const skills = viewModel.skills
  const languages = viewModel.languages
  const education = viewModel.education
  const projects = await enrichProjectsForDisplay(viewModel.projects)
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
        class="profile__main section-bg"
        >
        <h2 id="profile-main-heading" class="sr-only">Main Profile Content</h2>

        ${renderHeadingSection(context, subject, profileDetails, viewerMode, onSaved)}
        ${renderBioSection(store, subject, bioDetails, viewerMode, onSaved)}
        ${renderCVSection(store, subject, rolesByType, viewerMode, onSaved)}
        ${renderProjectSection(store, subject, projects, viewerMode, onSaved)}
        ${renderEducationSection(store, subject, education, viewerMode, onSaved)}
      </section>
      ${renderSidebar(store, subject, accounts, skills, languages, contactInfo, viewerMode, onSaved)}
    </main>
  `
}
