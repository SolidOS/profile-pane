import '../src/styles/global.css'
import { sym } from 'rdflib'
import { default as pane } from '../src'
import { context, fetcher } from './context'
import { authn, authSession } from 'solid-logic'
import * as UI from 'solid-ui'

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')

if (loginBanner) {
  loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))
}

async function finishLogin() {
  await authSession.handleIncomingRedirect()
  const session = authSession
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    if (webId) {
      webId.innerHTML = 'Logged in as: ' + authn.currentUser().uri
    }
  } else {
    if (webId) {
      webId.innerHTML = ''
    }
  }
}

finishLogin()

const webIdToShow = 'https://testingsolidos.solidcommunity.net/profile/card#me'

fetcher.load(webIdToShow).then(() => {
  const app = pane.render(sym(webIdToShow), context)
  const appEl = document.getElementById('app');
  if (appEl) {
    appEl.replaceWith(app);
  }
})
