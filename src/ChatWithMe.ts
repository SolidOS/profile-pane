import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { widgets, style } from 'solid-ui'
import { authn } from 'solid-logic'
import { asyncReplace } from 'lit-html/directives/async-replace.js'
import { chatWithMeButtonText, logInToChatWithMeButtonText, loadingMessage } from './texts'
import { checkIfAnyUserLoggedIn, complain } from './buttonsHelper'

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const logic = context.session.logic
  const longChatPane = context.session.paneRegistry.byName('long chat')

  async function* chatContainer() {
    const chatContainer = context.dom.createElement('div')

    let exists
    try {
       
      yield loadingMessage.toUpperCase(), (exists = await logic.chat.getChat(subject, false))
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      exists = false
    }
    if (exists) {
      chatContainer.appendChild(longChatPane.render(exists, context, {}))
      yield chatContainer
    } else {
      const me = authn.currentUser()
      let label = checkIfAnyUserLoggedIn(me) ? chatWithMeButtonText.toUpperCase() : logInToChatWithMeButtonText.toUpperCase()
      const button = widgets.button(
        context.dom,
        undefined,
        label,
        setButtonHandler,
        { needsBorder: true }
      )

      async function setButtonHandler(event) {
        event.preventDefault()
        try {
            const chat: NamedNode = await logic.chat.getChat(subject, true)
            chatContainer.innerHTML = ''
            chatContainer.appendChild(longChatPane.render(chat, context, {}))
        } catch (error) {
            complain(chatContainer, context, error)
        }
      }

      button.refresh = refreshButton()

      function refreshButton() {
        const me = authn.currentUser()
        const store: LiveStore = context.session.store
    
        if (checkIfAnyUserLoggedIn(me)) {
          button.innerHTML = chatWithMeButtonText.toUpperCase()
          button.className = 'button'
          button.setAttribute('class', style.primaryButton)
        } else {
          //not logged in
          button.innerHTML = logInToChatWithMeButtonText.toUpperCase()
          button.className = 'button'
          button.setAttribute('class', style.primaryButton)
        }
      }

      chatContainer.appendChild(button)
      yield chatContainer
    }
  }

  return html` ${asyncReplace(chatContainer())} `
}