import profileCardCss from './styles/ProfileCard.css'
import { html, render, nothing } from 'lit-html'
import { addMeToYourFriendsDiv } from './addMeToYourFriends'
import globalCssText from './styles/global.css'
import './QRCodeCardElement'


class ProfileCardElement extends HTMLElement {
    private _profileBasics: any
    private _context: any
    private _subject: any
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  async connectedCallback() {
    // Use raw-loader imports for CSS
    let globalSheet: CSSStyleSheet | null = null
    let cardSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string' && typeof profileCardCss === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
        if (!ProfileCardElement.sheet) {
          ProfileCardElement.sheet = new CSSStyleSheet()
          ProfileCardElement.sheet.replaceSync(profileCardCss)
        }
        cardSheet = ProfileCardElement.sheet
      }
    } catch (e) {
      globalSheet = null
      cardSheet = null
    }
    if ('adoptedStyleSheets' in Document.prototype && globalSheet && cardSheet) {
      this.shadow.adoptedStyleSheets = [globalSheet, cardSheet]
    } else {
      // Fallback for browsers or test environments without adoptedStyleSheets or CSSStyleSheet
      if (typeof globalCssText === 'string') {
        const styleGlobal = document.createElement('style')
        styleGlobal.textContent = globalCssText
        this.shadow.appendChild(styleGlobal)
      }
      if (typeof profileCardCss === 'string') {
        const styleCard = document.createElement('style')
        styleCard.textContent = profileCardCss
        this.shadow.appendChild(styleCard)
      }
    }
    this.render()
  }
  render() {
    const profileBasics = this.profileBasics
    const context = this.context
    const subject = this.subject
    if (!profileBasics || !context || !subject) {
      render(html``, this.shadow)
      return
    }
    render(html`
      <div class="cardFrame">
        <article class="profileCard" role="main" aria-labelledby="profile-name">
          <header class="header" aria-label="Profile information">
            ${Image(profileBasics.imageSrc, profileBasics.name)}
          </header>
          <section class="intro" aria-label="About">
            ${Line(profileBasics.introduction, '', 'About')}
            ${Line(profileBasics.location, '🌐', 'Location')}
            ${Line(profileBasics.pronouns, '', 'Pronouns')}
          </section>
          <section class="buttonSection" aria-label="Actions" role="complementary">
            ${addMeToYourFriendsDiv(subject, context)}
          </section>
          <aside class="qrCodeSection" aria-label="Contact QR Code" role="complementary">
            <qrcode-card
              .highlightColor=${profileBasics.highlightColor}
              .backgroundColor=${profileBasics.backgroundColor}
              .subject=${subject}
            ></qrcode-card>
          </aside>
        </article>
      </div>
    `, this.shadow)
  }
  get profileBasics() {
    return this._profileBasics
  }
  set profileBasics(val) {
    this._profileBasics = val
    this.render()
  }
  get context() {
    return this._context
  }
  set context(val) {
    this._context = val
    this.render()
  }
  get subject() {
    return this._subject
  }
  set subject(val) {
    this._subject = val
    this.render()
  }
}
if (!customElements.get('profile-card')) {
  customElements.define('profile-card', ProfileCardElement)
}

function Line(value, prefix: symbol | string = nothing, label: string = '') {
  return value ? html`
    <div class="details" role="text" ${label ? `aria-label="${label}: ${value}"` : ''}>
      ${prefix} ${value}
    </div>
  ` : nothing
}

function Image(src, alt) {
  return src ? html`
    <img 
      class="image" 
      src=${src} 
      alt="Profile photo of ${alt}"
      width="160"
      height="160"
      loading="eager"
    />
  ` : nothing
}
