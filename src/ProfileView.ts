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
import { QRCodeCard } from './QRCodeCard'
import { addMeToYourFriendsDiv } from './addMeToYourFriends'

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
        <header class="${styles.profileHeader}" aria-label="Profile Header">
          <h1 id="profile-card-heading">User Profile</h1>
        </header>
        ${ProfileCard(profileBasics)}
        ${addMeToYourFriendsDiv(subject, context)}
      </section>

      <section aria-labelledby="cv-heading" class="${styles.profileSection}" role="region">
        <h2 id="cv-heading">Professional & Education</h2>
        ${CVCard(profileBasics, rolesByType)}
      </section>

      <section aria-labelledby="social-heading" class="${styles.profileSection}" role="region">
        <h2 id="social-heading">Social Accounts</h2>
        ${SocialCard(profileBasics, accounts)}
      </section>

      <section aria-labelledby="stuff-heading" class="${styles.profileSection}" role="region">
        <h2 id="stuff-heading">Stuff You Share</h2>
        ${StuffCard(profileBasics, context, subject, stuffData)}
      </section>

      <section aria-labelledby="friends-heading" class="${styles.profileSection}" role="region">
        <h2 id="friends-heading">People You Know</h2>
        ${FriendList(profileBasics, subject, context)}
      </section>

      <section aria-labelledby="chat-heading" class="${styles.profileSection}" role="region">
        <h2 id="chat-heading">Chat With Me</h2>
        ${ChatWithMe(subject, context)}
      </section>

      <section aria-label="Profile Footer" class="${styles.profileSection}" role="region">
        <footer class="{styles.profileFooter}">
          <div data-testid="qrcode-display" class="qrcode-display" role="region" aria-label="QR Code">
            ${QRCodeCard(profileBasics, subject)}
          </div>
        </footer>
      </section>
    </main>
  `
}
