declare global {
  interface Window {
    __DEBUG_FRIENDS?: boolean;
  }
}
import { html, render } from 'lit-html'
import globalCssText from './styles/global.css'
import { FriendsPresentation } from './FriendsPresenter'
import { widgets } from 'solid-ui'


class FriendListElement extends HTMLElement {
  private _friendsData: FriendsPresentation | null = null
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
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
    const friendsData = this.friendsData
    if (!friendsData || !friendsData.friends || friendsData.friends.length === 0) {
      render(html``, this.shadow)
      return
    }
    render(html`
      <div class="cardFrame">
        <section
          class="friendListSection"
          role="region"
          aria-labelledby="friends-section-title"
          data-testid="friend-list"
        >
          <header>
            <h3 id="friends-section-title" class="sr-only">Friend Connections</h3>
          </header>
          <div role="table" aria-label="List of shared files and resources">
            <table class="profileTable" data-testid="friendsTable">
              <caption class="sr-only">Friends List</caption>
              <tbody>
                ${renderThings(friendsData.friends, document)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    `, this.shadow)
  }
  get friendsData() {
    return this._friendsData
  }
  set friendsData(val) {
    this._friendsData = val
    this.render()
  }
}
if (!customElements.get('friend-list')) {
  customElements.define('friend-list', FriendListElement)
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

function renderThings(things, dom) {
  if (!things || things.length === 0) return html``
  return html`${renderThing(things[0], dom)}${things.length > 1 ? renderThings(things.slice(1), dom) : html``}`
}

