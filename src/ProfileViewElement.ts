import { html, render } from 'lit-html'
import { LiveStore } from 'rdflib'
import './ChatWithMeElement'
import './FriendListElement'
import { presentFriends } from './FriendsPresenter'
import { presentProfile } from './presenter'
import { presentCV } from './CVPresenter'
import { presentSocial } from './SocialPresenter'
import { presentStuff } from './StuffPresenter'
import './ProfileCardElement'
import './SocialCardElement'
import './StuffCardElement'
import './CVCardElement'
import './QRCodeCardElement'
import globalCssText from './styles/global.css'
import profileCardCss from './styles/ProfileCard.css'


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


export class ProfileViewElement extends HTMLElement {
  subject?: any
  context?: any
  async connectedCallback() {
    // Attach shadow root
    const shadow = this.attachShadow({ mode: 'open' })
    let globalSheet: CSSStyleSheet | null = null
    let cardSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string' && typeof profileCardCss === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
        cardSheet = new CSSStyleSheet()
        cardSheet.replaceSync(profileCardCss)
      }
    } catch (e) {
      globalSheet = null
      cardSheet = null
    }
    if ('adoptedStyleSheets' in Document.prototype && globalSheet && cardSheet) {
      shadow.adoptedStyleSheets = [globalSheet, cardSheet]
    } else {
      // Fallback for browsers or test environments without adoptedStyleSheets or CSSStyleSheet
      if (typeof globalCssText === 'string') {
        const styleGlobal = document.createElement('style')
        styleGlobal.textContent = globalCssText
        shadow.appendChild(styleGlobal)
      }
      if (typeof profileCardCss === 'string') {
        const styleCard = document.createElement('style')
        styleCard.textContent = profileCardCss
        shadow.appendChild(styleCard)
      }
    }
    // Use instance properties
    const subject = this.subject
    const context = this.context
    const profileBasics = presentProfile(subject, context.session.store as LiveStore)
    const cvData = presentCV(subject, context.session.store as LiveStore)
    const accounts = presentSocial(subject, context.session.store as LiveStore)
    const friendsData = presentFriends(subject, context)
    const stuffData = await presentStuff(subject)

    const template = html`
      <main
        id="main-content"
        class="profile-grid"
        style=${`--profile-grid-bg: radial-gradient(circle, ${profileBasics.backgroundColor} 80%, ${profileBasics.highlightColor} 100%)`}
        role="main"
        aria-label=${`Profile for ${profileBasics.name}`}
        tabindex="-1"
      >
        <section 
          aria-labelledby="profile-card-heading" 
          class="profileSection"
          role="complementary"
          tabindex="-1"
        >
          <header>
            <h2 id="profile-card-heading" tabindex="-1">${profileBasics.name}</h2>
          </header>
          <profile-card .profileBasics=${profileBasics} .context=${context} .subject=${subject}></profile-card>
        </section>

        ${cvData && 
          (cvData.rolesByType.PastRole.length > 0 ||
          cvData.rolesByType.FutureRole.length > 0 ||
          cvData.rolesByType.CurrentRole.length > 0 || 
          cvData.languages.length > 0 || 
          cvData.skills.length > 0) ? html`
          <section 
            aria-labelledby="cv-heading" 
            class="profileSection" 
            role="complementary"
            tabindex="-1"
          >
            <header>
              <h2 id="cv-heading" tabindex="-1">CV</h2>
            </header>
            <nav aria-label="CV">
              <cv-card .cvData=${cvData}></cv-card>
            </nav>
          </section>
        ` : ''}

        ${accounts.accounts && accounts.accounts.length > 0 ? html`
          <section 
            aria-labelledby="social-heading" 
            class="profileSection" 
            role="complementary"
            tabindex="-1"
          >
            <header>
              <h2 id="social-heading" tabindex="-1">Social Accounts</h2>
            </header>
            <nav aria-label="Social media links">
              <social-card .socialData=${accounts}></social-card>
            </nav>
          </section>
        ` : ''}

        ${stuffData.stuff && stuffData.stuff.length > 0 ? html`
          <section 
            aria-labelledby="stuff-heading" 
            class="profileSection" 
            role="region"
            tabindex="-1"
          >
            <header>
              <h2 id="stuff-heading" tabindex="-1">Shared Items</h2>
            </header>
            <div role="complementary" aria-label="Shared files and resources">
              <stuff-card .profileBasics=${profileBasics} .context=${context} .subject=${subject} .stuffData=${stuffData}></stuff-card>
            </div>
          </section>
        ` : ''}

        ${friendsData.friends && friendsData.friends.length > 0 ? html`
          <section 
            aria-labelledby="friends-heading" 
            class="profileSection" 
            role="complementary"
            tabindex="-1"
          >
            <header>
              <h2 id="friends-heading" tabindex="-1">Friends</h2>
            </header>
            <friend-list .friendsData=${friendsData}></friend-list>
          </section>
        ` : ''}

        <section 
          aria-labelledby="chat-heading" 
          class="profileSection" 
          role="region"
          tabindex="-1"
        >
          <header>
            <h2 id="chat-heading" tabindex="-1">Contact</h2>
          </header>
          <div role="complementary" aria-label="Communication options">
            <chat-with-me .subject=${subject} .context=${context}></chat-with-me>
          </div>
        </section>
      </main>
    `
    render(template, shadow)
  }
}
if (!customElements.get('profile-view')) {
  customElements.define('profile-view', ProfileViewElement)
}
