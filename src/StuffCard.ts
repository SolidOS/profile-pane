import { html, render } from 'lit-html'
import { widgets } from 'solid-ui'
import globalCssText from './styles/global.css'

const dom = document

class StuffCardElement extends HTMLElement {
    private _stuffData: any
    private _profileBasics: any
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  async connectedCallback() {
    let globalSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
      }
    } catch (e) {
      globalSheet = null
    }
    if ('adoptedStyleSheets' in Document.prototype && globalSheet) {
      this.shadow.adoptedStyleSheets = [globalSheet]
    } else {
      // Fallback for browsers or test environments without adoptedStyleSheets or CSSStyleSheet
      if (typeof globalCssText === 'string') {
        const styleGlobal = document.createElement('style')
        styleGlobal.textContent = globalCssText
        this.shadow.appendChild(styleGlobal)
      }
    }
    this.render()
  }
  render() {
    const stuffData = this.stuffData
    const profileBasics = this.profileBasics
    if (!stuffData || !stuffData.stuff || !profileBasics) {
      render(html``, this.shadow)
      return
    }
    render(html`
      <div class="cardFrame">
        <section
          aria-labelledby="stuff-card-title"
          role="region"
          data-testid="stuff"
        >
          <header>
            <h3 id="stuff-card-title" class="sr-only">Shared Resources</h3>
          </header>
          <div role="table" aria-label="List of shared files and resources">
            <table class="profileTable" data-testid="stuffTable">
              <caption class="sr-only">Files and resources shared by ${profileBasics.name}</caption>
              <tbody>
                ${renderThings(stuffData.stuff)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `, this.shadow)
  }
  get stuffData() {
    return this._stuffData
  }
  set stuffData(val) {
    this._stuffData = val
    this.render()
  }
  get profileBasics() {
    return this._profileBasics
  }
  set profileBasics(val) {
    this._profileBasics = val
    this.render()
  }
}
if (!customElements.get('stuff-card')) {
  customElements.define('stuff-card', StuffCardElement)
}

function renderThingAsDOM (thing, dom) {
  const options = {}
  // widgets.personTR returns a DOM node, so we need to convert it to HTML string
  const row = widgets.personTR(dom, null, thing.instance, options)
  return row
}

function renderThing (thing, dom) {
  return renderThingAsDOM(thing, dom)
}

function renderThings(things) {
  if (!things || things.length === 0) return html``
  return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1)) : html``}`
}