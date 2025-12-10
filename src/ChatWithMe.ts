import chatWithMeCss from './styles/ChatWithMe.css'
import { html, render } from 'lit-html'
import { widgets } from 'solid-ui'
import { authn } from 'solid-logic'
import { chatWithMeButtonText, logInToChatWithMeButtonText, loadingMessage } from './texts'
import { checkIfAnyUserLoggedIn, complain } from './buttonsHelper'
import globalCssText from './styles/global.css'

class ChatWithMeElement extends HTMLElement {
    private _subject: any
    private _context: any
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  async connectedCallback() {
    let globalSheet: CSSStyleSheet | null = null
    let cardSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string' && typeof chatWithMeCss === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
        if (!ChatWithMeElement.sheet) {
          ChatWithMeElement.sheet = new CSSStyleSheet()
          ChatWithMeElement.sheet.replaceSync(chatWithMeCss)
        }
        cardSheet = ChatWithMeElement.sheet
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
      if (typeof chatWithMeCss === 'string') {
        const styleCard = document.createElement('style')
        styleCard.textContent = chatWithMeCss
        this.shadow.appendChild(styleCard)
      }
    }
    this.render()
  }
  render(this: ChatWithMeElement) {
    const self = this
    const subject = self.subject
    const context = self.context
    if (!subject || !context) {
      render(html``, self.shadow)
      return
    }
    const logic = context.session.logic
    const longChatPane = context.session.paneRegistry.byName('long chat')
    const frame = document.createElement('div')
    frame.setAttribute('class', 'cardFrame')
    const chatContainer = document.createElement('div')
    chatContainer.setAttribute('class', 'chatSection')
    chatContainer.setAttribute('aria-labelledby', 'chat-section-title')
    chatContainer.setAttribute('role', 'region')
    chatContainer.setAttribute('data-testid', 'chat')
    const title = document.createElement('h3')
    title.id = 'chat-section-title'
    title.className = 'sr-only'
    title.textContent = 'Communication'
    chatContainer.appendChild(title)
    let exists;
    (async () => {
      try {
        render(html`
          <div class="chatLoading" role="status" aria-live="polite">
            ${loadingMessage.toUpperCase()}
          </div>
        `, self.shadow)
        exists = await logic.chat.getChat(subject, false)
      } catch (e) {
        exists = false
      }
      if (exists) {
        const chatArea = document.createElement('div')
        chatArea.setAttribute('role', 'log')
        chatArea.setAttribute('aria-label', 'Chat conversation')
        chatArea.appendChild(longChatPane.render(exists, context, {}))
        chatContainer.appendChild(chatArea)
        frame.appendChild(chatContainer)
        render(frame, self.shadow)
      } else {
        const me = authn.currentUser()
        let label = checkIfAnyUserLoggedIn(me) ? chatWithMeButtonText.toUpperCase() : logInToChatWithMeButtonText.toUpperCase()
        const button = widgets.button(
          document,
          undefined,
          label,
          setButtonHandler,
          { needsBorder: true }
        )
        async function setButtonHandler(event) {
          event.preventDefault()
          try {
            const chat = await logic.chat.getChat(subject, true)
            chatContainer.innerHTML = ''
            chatContainer.appendChild(longChatPane.render(chat, context, {}))
            frame.appendChild(chatContainer)
            render(frame, self.shadow)
          } catch (error) {
            complain(chatContainer, context, error)
          }
        }
        button.refresh = refreshButton()
        function refreshButton() {
          const me = authn.currentUser()
          if (checkIfAnyUserLoggedIn(me)) {
            button.innerHTML = chatWithMeButtonText.toUpperCase()
            button.className = 'button'
            button.setAttribute('class', 'button')
          } else {
            button.innerHTML = logInToChatWithMeButtonText.toUpperCase()
            button.className = 'button'
            button.setAttribute('class', 'button')
          }
        }
        button.setAttribute('type', 'button')
        button.setAttribute('aria-describedby', 'chat-button-description')
        const description = document.createElement('span')
        description.id = 'chat-button-description'
        description.className = 'sr-only'
        description.textContent = 'Start a new conversation or sign in to continue existing chat'
        chatContainer.appendChild(button)
        chatContainer.appendChild(description)
        frame.appendChild(chatContainer)
        render(frame, self.shadow)
      }
    })()
  }
  get subject() {
    return this._subject
  }
  set subject(val) {
    this._subject = val
    this.render()
  }
  get context() {
    return this._context
  }
  set context(val) {
    this._context = val
    this.render()
  }
}
if (!customElements.get('chat-with-me')) {
  customElements.define('chat-with-me', ChatWithMeElement)
}