import { sym } from 'rdflib'
//import { default as pane } from '../src/profileEditor' //uncomment for profile editor
import { default as pane } from '../src'
import './dev-global.css' // Import after src to override component styles
import { context, fetcher } from './context'
import { authn, authSession } from 'solid-logic'
import * as UI from 'solid-ui'

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')

loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))

// const webIdToShow = 'https://testingsolidos.solidcommunity.net/profile/card#me'

async function finishLogin() {
  await authSession.handleIncomingRedirect()
  const session = authSession
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    webId.innerHTML = 'Logged in as: ' + authn.currentUser().uri
  } else {
    webId.innerHTML = ''
  }
  fetcher.load(webIdToShow).then(() => {
  const app = pane.render(sym(webIdToShow), context)
  document.getElementById('app').replaceWith(app)
})
}

finishLogin()

// const webIdToShow = 'https://testingsolidos.solidcommunity.net/profile/card#me'
const webIdToShow = 'https://sstratsianis2.solidcommunity.net/profile/card#me'

// const webIdToShow = 'https://jeff-zucker.solidcommunity.net/profile/card#me'
