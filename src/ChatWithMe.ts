import { html, TemplateResult } from 'lit-html'
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { widgets } from 'solid-ui'
import { authn } from 'solid-logic'
import { asyncReplace } from 'lit-html/directives/async-replace.js'
import { chatWithMeButtonText, logInToChatWithMeButtonText, loadingMessage } from './texts'
import { checkIfAnyUserLoggedIn, complain } from './buttonsHelper'
import './styles/ChatWithMe.css'

export const ChatWithMe = (
  subject: NamedNode,
  context: DataBrowserContext
): TemplateResult => {
  const logic = context.session.logic
  const longChatPane = context.session.paneRegistry.byName('long chat')

  async function* chatContainer() {
    const chatContainer = context.dom.createElement('section') as HTMLDivElement
    chatContainer.setAttribute('class', 'chatSection section-centered')
    chatContainer.setAttribute('aria-labelledby', 'chat-section-title')
    chatContainer.setAttribute('role', 'region')
    chatContainer.setAttribute('data-testid', 'chat')

    // Add hidden title for screen readers
    const title = context.dom.createElement('h3')
    title.id = 'chat-section-title'
    title.className = 'sr-only'
    title.textContent = 'Communication'
    chatContainer.appendChild(title)

    let exists
    try {
      yield html`
      <div class="buttonSubSection">
        <div class="actionButton loading-text center" role="status" aria-live="polite">
          ${loadingMessage.toUpperCase()}
        </div>
      </div>
      `
      exists = await logic.chat.getChat(subject, false)
    } catch (e) {
      exists = false
    }
    
    if (exists) {
      const chatArea = context.dom.createElement('div')
      chatArea.setAttribute('role', 'log')
      chatArea.setAttribute('aria-label', 'Chat conversation')
      chatArea.appendChild(longChatPane.render(exists, context, {}))
      chatContainer.appendChild(chatArea)
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
    
        if (checkIfAnyUserLoggedIn(me)) {
          button.innerHTML = chatWithMeButtonText.toUpperCase()
        } else {
          //not logged in
          button.innerHTML = logInToChatWithMeButtonText.toUpperCase()
        }
      }

      button.setAttribute('type', 'button')
      button.setAttribute('aria-describedby', 'chat-button-description')
      
      const description = context.dom.createElement('span')
      description.id = 'chat-button-description'
      description.className = 'sr-only'
      description.textContent = 'Start a new conversation or sign in to continue existing chat'
      
      button.classList.add('actionButton', 'btn-primary', 'action-button-focus')
      chatContainer.appendChild(button)
      chatContainer.appendChild(description)
      yield chatContainer
    }
  }

  return html` ${asyncReplace(chatContainer())} `
}