import socialCardCss from './styles/SocialCard.css'
import { html, render } from 'lit-html'
import globalCssText from './styles/global.css'

class SocialCardElement extends HTMLElement {
  private _socialData: any
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  async connectedCallback() {
    let globalSheet: CSSStyleSheet | null = null
    let cardSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string' && typeof socialCardCss === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
        if (!SocialCardElement.sheet) {
          SocialCardElement.sheet = new CSSStyleSheet()
          SocialCardElement.sheet.replaceSync(socialCardCss)
        }
        cardSheet = SocialCardElement.sheet
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
      if (typeof socialCardCss === 'string') {
        const styleCard = document.createElement('style')
        styleCard.textContent = socialCardCss
        this.shadow.appendChild(styleCard)
      }
    }
    this.render()
  }
  render() {
    const socialData = this.socialData
    if (!socialData || !socialData.accounts || !socialData.accounts.length) {
      render(html``, this.shadow)
      return
    }
    render(html`
      <div class="cardFrame">
        <section
          class="socialCard"
          aria-labelledby="social-card-title"
          role="region"
          data-testid="social-media"
        >
          <header class="socialHeader">
            <h3 id="social-card-title">Follow me on</h3>
          </header>
          <nav aria-label="Social media profiles">
            <ul class="socialList" role="list">
              ${socialData.accounts.map(account => this.renderAccount(account))}
            </ul>
          </nav>
        </section>
      </div>
    `, this.shadow)
  }
  renderAccount(account) {
    return account.homepage && account.name && account.icon
      ? html`
          <li class="socialItem" role="listitem">
            <a 
              href="${account.homepage}" 
              target="_blank" 
              rel="noopener noreferrer" 
              aria-label="Visit ${account.name} profile (opens in new tab)"
            >
              <img 
                class="socialIcon" 
                src="${account.icon}" 
                alt="${account.name} icon"
                width="40"
                height="40"
                loading="lazy"
              />
              <span>${account.name}</span>
            </a>
          </li>
        `
      : html``
  }
  get socialData() {
    return this._socialData
  }
  set socialData(val) {
    this._socialData = val
    this.render()
  }
}
if (!customElements.get('social-card')) {
  customElements.define('social-card', SocialCardElement)
}
