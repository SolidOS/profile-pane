import { sym } from 'rdflib'
//import { default as pane } from '../src/editProfilePane/EditProfileView' //uncomment for profile editor
import { default as pane } from '../src'
import './dev-global.css' // Import after src to override component styles
import { context, fetcher } from './context'
import { authn, authSession } from 'solid-logic'
import * as UI from 'solid-ui'

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')

if (loginBanner) {
  loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))
}

const webIdToShow = 'https://testingsolidos.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sstratsianis.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sstratsianis2.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sharontest.solidcommunity.net/profile/card#me'

async function finishLogin() {
  await authSession.handleIncomingRedirect()
  const session = authSession
  if (webId) {
    if (session.info.isLoggedIn) {
      const currentUser = authn.currentUser()
      webId.textContent = currentUser ? `Logged in as: ${currentUser.uri}` : ''
    } else {
      webId.textContent = ''
    }
  }

  fetcher.load(webIdToShow).then(() => {
    const app = pane.render(sym(webIdToShow), context)
    const appRoot = document.getElementById('app')
    if (appRoot) {
      appRoot.replaceWith(app)
    }
  })
}

finishLogin()