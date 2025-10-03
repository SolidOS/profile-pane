import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import * as styles from './styles/ProfileView.module.css'
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
      class="profile-grid"
      style="--profile-grid-bg: radial-gradient(circle, ${profileBasics.backgroundColor} 80%, ${profileBasics.highlightColor} 100%)"
      role="main"
      aria-label="User Profile"
    >
      <section aria-labelledby="profile-card-heading" class="${styles.profileSection}" role="region">
        <h2 id="profile-card-heading">${profileBasics.name}</h2>
        ${ProfileCard(profileBasics, context, subject)}
      </section>


      ${(() => {
        const cv = CVCard(profileBasics, rolesByType)
        return cv && cv.strings && cv.strings.join('').trim() !== '' ? html`
          <section aria-labelledby="cv-heading" class="${styles.profileSection}" role="region">
            <h2 id="cv-heading">Professional & education</h2>
            ${cv}
          </section>
        ` : ''
      })()}

      ${accounts.accounts && accounts.accounts.length > 0 ? html`
        <section aria-labelledby="social-heading" class="${styles.profileSection}" role="region">
          <h2 id="social-heading">Social accounts</h2>
          ${SocialCard(profileBasics, accounts)}
        </section>
      ` : ''}

      ${stuffData.stuff && stuffData.stuff.length > 0 ? html`
        <section aria-labelledby="stuff-heading" class="${styles.profileSection}" role="region">
          <h2 id="stuff-heading">To share</h2>
          ${StuffCard(profileBasics, context, subject, stuffData)}
        </section>
      ` : ''}


      ${(() => {
        const friends = FriendList(profileBasics, subject, context)
        return friends && friends.strings && friends.strings.join('').trim() !== '' ? html`
          <section aria-labelledby="friends-heading" class="${styles.profileSection}" role="region">
            <h2 id="friends-heading">Friends</h2>
            ${friends}
          </section>
        ` : ''
      })()}

      <section aria-labelledby="chat-heading" class="${styles.profileSection}" role="region">
        <h2 id="chat-heading">Chat with me</h2>
        ${ChatWithMe(subject, context)}
      </section>
    </main>
  `
}
