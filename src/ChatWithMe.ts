import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { asyncReplace } from 'lit-html/directives/async-replace.js'
import { chatWithMeButtonText, loadingMessage } from './texts'
import * as styles from './styles/ChatWithMe.module.css'

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const logic = context.session.logic
  const longChatPane = context.session.paneRegistry.byName('long chat')

  async function* chatContainer() {
    let exists
    try {
      yield html`<div class="${styles.chatLoading}" role="status">${loadingMessage}</div>`, (exists = await logic.chat.getChat(subject, false))
    } catch (e) {
      exists = false
    }
    if (exists) {
      yield html`
        <section class="${styles.chatSection}" aria-label="Chat Conversation">
          <header class="${styles.chatHeader}">
            <h2>Chat</h2>
          </header>
          <div>
            ${longChatPane.render(exists, context, {})}
          </div>
        </section>
      `
    } else {
      let errorMsg = ''
      let isLoading = false
      let chat: NamedNode | null = null
      let rerender: (() => void) | null = null

      function renderButton() {
        return html`
          <section class="${styles.chatSection}" aria-label="Start Chat">
            <header class="${styles.chatHeader}">
              <h2>Chat</h2>
            </header>
            <button
              class="${styles.chatButton}"
              aria-label="${chatWithMeButtonText}"
              @click=${handleClick}
              ?disabled=${isLoading}
            >
              ${isLoading ? loadingMessage : chatWithMeButtonText}
            </button>
            ${errorMsg
              ? html`<div class="${styles.chatError}" role="alert">${errorMsg}</div>`
              : ''}
          </section>
        `
      }

      const handleClick = async (event: Event) => {
        isLoading = true
        if (rerender) rerender()
        try {
          chat = await logic.chat.getChat(subject, true)
          errorMsg = ''
          isLoading = false
          if (rerender) rerender()
        } catch (e) {
          errorMsg = e.message
          isLoading = false
          if (rerender) rerender()
        }
      }

      // Main generator loop for reactivity
      let first = true
      while (!chat) {
        if (first) {
          first = false
          yield renderButton()
        } else {
          yield new Promise<unknown>(resolve => {
            rerender = () => resolve(undefined)
          }).then(() => renderButton())
        }
      }
      yield html`
        <section class="${styles.chatSection}" aria-label="Chat Conversation">
          <header class="${styles.chatHeader}">
            <h2>Chat</h2>
          </header>
          <div>
            ${longChatPane.render(chat, context, {})}
          </div>
        </section>
      `
    }
  }

  return html`${asyncReplace(chatContainer())}`
}
