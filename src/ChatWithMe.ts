import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { asyncReplace } from 'lit-html/directives/async-replace.js'
import { chatWithMeButtonText, logInToChatWithMeButtonText, loadingMessage } from './texts'
import { authn } from 'solid-logic'
import { checkIfAnyUserLoggedIn } from './addMeToYourFriends'
import { clearPreviousMessage, complain } from './buttonsHelper'
import { widgets } from 'solid-ui'
import * as styles from './styles/ChatWithMe.module.css'

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const logic = context.session.logic
  const longChatPane = context.session.paneRegistry.byName('long chat')
  let buttonContainer = context.dom.createElement('div')
  let errorMsg = ''
  let isLoading = false
  let chat: NamedNode | null = null
  let rerender: (() => void) | null = null

  function setButtonHandler(event) {
    event.preventDefault()
    isLoading = true
    rerender && rerender()
    logic.chat.getChat(subject, true)
      .then((result) => {
        chat = result
        errorMsg = ''
        isLoading = false
        rerender && rerender()
      })
      .catch((e) => {
        errorMsg = e.message
        isLoading = false
        rerender && rerender()
      })
  }

  function renderButton() {
    clearPreviousMessage(buttonContainer)
    const me = authn.currentUser()
    const label = checkIfAnyUserLoggedIn(me) ? chatWithMeButtonText : logInToChatWithMeButtonText
    const button = widgets.button(
      context.dom,
      undefined,
      label,
      setButtonHandler,
      { needsBorder: true }
    )
    button.disabled = isLoading
    if (isLoading) button.innerHTML = loadingMessage
    buttonContainer.appendChild(button)
    if (errorMsg) {
      clearPreviousMessage(buttonContainer)
      complain(buttonContainer, context, errorMsg)
    }
    return html`<div class="center">${buttonContainer}</div>`
  }

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
