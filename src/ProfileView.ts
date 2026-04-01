import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { authn } from 'solid-logic'
import './styles/ProfileView.css'
import { ChatWithMe } from './ChatWithMe'
import { FriendList } from './FriendList'
import { presentProfile } from './presenter'
import { presentCV } from './CVPresenter' // 20210527
import { presentSocial } from './SocialPresenter' // 20210527
import { presentStuff } from './StuffPresenter' // 20210527
import { ProfileCard } from './ProfileCard'
import { CVCard } from './CVCard'
import { SocialCard } from './SocialCard'
import { StuffCard } from './StuffCard'
import { QRCodeCard } from './QRCodeCard'
import {
  resumeHeadingText,
  socialAccountsHeadingText,
  sharedItemsHeadingText,
  friendsHeadingText,
  contactHeadingText
} from './texts'
import { ViewerMode } from './types'
import { strToUpperCase } from './textUtils'
import { selectProfileDetails } from './ProfileDetailsSelector'

type ProfileBasics = ReturnType<typeof presentProfile>
type SocialAccounts = ReturnType<typeof presentSocial>
type StuffData = Awaited<ReturnType<typeof presentStuff>>
type ProfileDetails = ReturnType<typeof selectProfileDetails>


function getViewerMode(subject: NamedNode): ViewerMode {
  let mode: ViewerMode = 'anonymous'
  if (authn.currentUser() && authn.currentUser().sameTerm(subject)) mode = 'owner'
  if (authn.currentUser() && !authn.currentUser().sameTerm(subject)) mode = 'authenticated'
  return mode
}

function renderSocialAccounts(accounts: SocialAccounts, viewerMode: ViewerMode) {
   return accounts.accounts && accounts.accounts.length > 0 ? html`
        <aside 
          aria-labelledby="social-heading" 
          class="profileSection section-bg" 
          role="complementary"
          tabindex="-1"
        >
          <header class="text-center mb-md">
            <h2 id="social-heading" tabindex="-1">${socialAccountsHeadingText}</h2>
          </header>
          <nav aria-label="Social media links">
            ${SocialCard(accounts, viewerMode)}
          </nav>
        </aside>
      ` : ''
}

function renderStuffSection(stuffData: StuffData, profileBasics: ProfileBasics, context: DataBrowserContext, subject: NamedNode, viewerMode: ViewerMode) {
  return stuffData.stuff && stuffData.stuff.length > 0 ? html`
    <section 
      aria-labelledby="stuff-heading" 
      class="profileSection section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="stuff-heading" tabindex="-1">${sharedItemsHeadingText}</h2>
      </header>
      <div>
        ${StuffCard(profileBasics, context, subject, stuffData, viewerMode)}
      </div>
    </section>
  ` : ''
}

function renderCVSection(rolesByType, viewerMode: ViewerMode) {
  const cv = CVCard(rolesByType, viewerMode)
  return cv && cv.strings && cv.strings.join('').trim() !== '' ? html`
    <section 
      aria-labelledby="cv-heading" 
      class="profileSection section-bg" 
      role="region"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="cv-heading" tabindex="-1">${resumeHeadingText}</h2>
      </header>
      <div>
        ${cv}
      </div>
    </section>
  ` : ''
}

function renderFriendsSection(subject: NamedNode, context: DataBrowserContext, viewerMode: ViewerMode) {
  const friends = FriendList(subject, context, viewerMode)
  return friends ? html`
    <aside
      aria-labelledby="friends-heading"
      class="profileSection section-bg"
      role="complementary"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="friends-heading" tabindex="-1">${friendsHeadingText}</h2>
      </header>
      <div role="list" aria-label="Friend connections">
        ${friends}
      </div>
    </aside>
  ` : ''
}

function renderSidebar(
  accounts: SocialAccounts,
  profileDetails: ProfileDetails,
  stuffData: StuffData,
  profileBasics: ProfileBasics,
  context: DataBrowserContext,
  subject: NamedNode,
  viewerMode: ViewerMode
) {
  return html`
    <aside 
      aria-labelledby="sidebar-heading" 
      class="profileSection profileSidebar section-bg" 
      role="complementary"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="sidebar-heading" tabindex="-1">Sidebar</h2>
      </header>
      <nav aria-label="Sidebar navigation">
        ${renderSocialAccounts(accounts, viewerMode)}
        ${renderSkillsSection(profileDetails)}
        ${renderLanguageSection(profileDetails)}
        ${renderQRCode(profileBasics, subject)}
      </nav>
    </aside>
  `
}

function renderChatWithMeSection(subject: NamedNode, context: DataBrowserContext, viewerMode: ViewerMode) {
  return html`
    <section
      aria-labelledby="chat-heading"
      class="profileSection section-bg"
      role="region"
      tabindex="-1"
    >
      <header class="text-center mb-md">
        <h2 id="chat-heading" tabindex="-1">${contactHeadingText}</h2>
      </header>
      <div>
        ${ChatWithMe(subject, context, viewerMode)}
      </div>
    </section>
  `
}

function renderQRCode(profileBasics: ProfileBasics, subject: NamedNode) {
  return html`
      <div class="qrCodeSection section-centered">
        ${QRCodeCard(profileBasics.highlightColor, profileBasics.backgroundColor, subject)}
      </div>
  `
}

function renderSkill(skill, asList = false) {
  if (!skill) return html``
  return asList
    ? html`<li class="cvSkill">${strToUpperCase(skill)}</li>`
    : html``
}

function renderSkills(skills, asList = false) {
  if (!skills || !skills.length || !skills[0]) return html``
  return html`${renderSkill(skills[0], asList)}${skills.length > 1 ? renderSkills(skills.slice(1), asList) : html``}`
}

function renderSkillsSection(profileDetails: ProfileDetails) {
  const { skills } = profileDetails
  const skillsArr = skills || []
  const hasSkills = Array.isArray(skillsArr) && skillsArr.length > 0

  return hasSkills ? html`
    <section class="cvSection" aria-labelledby="cv-skills-heading">
      <h3 id="cv-skills-heading">Skills</h3>
      <ul role="list" aria-label="Professional skills and competencies">
        ${renderSkills(skillsArr, true)}
      </ul>
    </section>
  ` : ''
}

function renderLan(language, asList = false) {
  if (!language) return html``
  return asList
    ? html`<li class="cvLanguage">${language}</li>`
    : html``
}

function renderLanguages(languages, asList = false) {
  if (!languages || !languages.length || !languages[0]) return html``
  return html`${renderLan(languages[0], asList)}${languages.length > 1 ? renderLanguages(languages.slice(1), asList) : html``}`
}

function renderLanguageSection(profileDetails: ProfileDetails) {
  const { languages } = profileDetails
  const languagesArr = languages || []
  const hasLanguages = Array.isArray(languagesArr) && languagesArr.length > 0

  return hasLanguages ? html`
    <section class="cvSection" aria-labelledby="cv-languages-heading">
      <h3 id="cv-languages-heading">Languages</h3>
      <ul role="list" aria-label="Known languages">
        ${renderLanguages(languagesArr, true)}
      </ul>
    </section>
  ` : ''
}

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext
): Promise <TemplateResult> {
  const store = context.session.store as LiveStore
  const viewerMode = getViewerMode(subject)

  const profileBasics = presentProfile(subject, store, viewerMode)
  const rolesByType = presentCV(subject, store)
  const profileDetails = selectProfileDetails(subject, store)
  const accounts = presentSocial(subject, store, viewerMode) 
  const stuffData = await presentStuff(subject, viewerMode)

  return html` 
    <main
      id="main-content"
      class="profile-grid"
      style="--profile-grid-bg: radial-gradient(circle, ${profileBasics.backgroundColor} 80%, ${profileBasics.highlightColor} 100%)"
      role="main"
      aria-label="Profile for ${profileBasics.name}"
      tabindex="-1"
    > 

      <article 
        aria-labelledby="profile-card-heading" 
        class="profileSection section-bg" 
        role="region"
        tabindex="-1"
      >
        <header class="text-center mb-md">
          <h2 id="profile-card-heading" tabindex="-1">${profileBasics.name}</h2>
        </header>
        ${ProfileCard(profileBasics, context, subject, viewerMode)}
      </article>

      ${renderCVSection(rolesByType, viewerMode)}

      ${renderSidebar(accounts, profileDetails, stuffData, profileBasics, context, subject, viewerMode)}
    </main>
  `
}
