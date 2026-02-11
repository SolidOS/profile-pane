import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
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

// The edit button switches to the editor pane
/*
function renderEditButton (subject) {
  return 
    authn.currentUser() && authn.currentUser().sameTerm(subject) ?
        html `<button type="button" class="ProfilePaneCVEditButton">
        <img  src="${editButtonURI}">
        Edit</button>`
    : html``;
}
*/

export async function ProfileView (
  subject: NamedNode,
  context: DataBrowserContext
): Promise <TemplateResult> {
  const profileBasics = presentProfile(subject, context.session.store as LiveStore)
  const rolesByType = presentCV(subject, context.session.store as LiveStore)
  const accounts = presentSocial(subject, context.session.store as LiveStore)
  const stuffData = await presentStuff(subject)

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
        ${ProfileCard(profileBasics, context, subject)}
      </article>

      ${(() => {
        const cv = CVCard(rolesByType)
        return cv && cv.strings && cv.strings.join('').trim() !== '' ? html`
          <section 
            aria-labelledby="cv-heading" 
            class="profileSection section-bg" 
            role="region"
            tabindex="-1"
          >
            <header class="text-center mb-md">
              <h2 id="cv-heading" tabindex="-1">Resume</h2>
            </header>
            <div>
              ${cv}
            </div>
          </section>
        ` : ''
      })()}

      ${accounts.accounts && accounts.accounts.length > 0 ? html`
        <aside 
          aria-labelledby="social-heading" 
          class="profileSection section-bg" 
          role="complementary"
          tabindex="-1"
        >
          <header class="text-center mb-md">
            <h2 id="social-heading" tabindex="-1">Social Accounts</h2>
          </header>
          <nav aria-label="Social media links">
            ${SocialCard(accounts)}
          </nav>
        </aside>
      ` : ''}

      ${stuffData.stuff && stuffData.stuff.length > 0 ? html`
        <section 
          aria-labelledby="stuff-heading" 
          class="profileSection section-bg" 
          role="region"
          tabindex="-1"
        >
          <header class="text-center mb-md">
            <h2 id="stuff-heading" tabindex="-1">Shared Items</h2>
          </header>
          <div>
            ${StuffCard(profileBasics, context, subject, stuffData)}
          </div>
        </section>
      ` : ''}

      ${(() => {
        const friends = FriendList(subject, context)
        return friends ? html`
          <aside 
            aria-labelledby="friends-heading" 
            class="profileSection section-bg" 
            role="complementary"
            tabindex="-1"
          >
            <header class="text-center mb-md">
              <h2 id="friends-heading" tabindex="-1">Friends</h2>
            </header>
            <div role="list" aria-label="Friend connections">
              ${friends}
            </div>
          </aside>
        ` : ''
      })()}

      <section 
        aria-labelledby="chat-heading" 
        class="profileSection section-bg" 
        role="region"
        tabindex="-1"
      >
        <header class="text-center mb-md">
          <h2 id="chat-heading" tabindex="-1">Contact</h2>
        </header>
        <div>
          ${ChatWithMe(subject, context)}
        </div>
      </section>
    </main>
  `
}
