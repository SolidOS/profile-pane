import { sym } from 'rdflib'
//import { default as pane } from '../src/editProfilePane/EditProfileView' //uncomment for profile editor
import { default as pane } from '../src'
// @ts-ignore side-effect CSS import for dev webpack bundle
import './dev-global.css' // Import after src to override component styles
// @ts-ignore side-effect CSS import for dev webpack bundle
import './dev-utilities.css'
import {
  context,
  environment,
  fetcher,
  syncEnvironmentToWindow,
  updateEnvironment,
} from './context'
import { authn, authSession } from 'solid-logic'
import * as UI from 'solid-ui'

const loginBanner = document.getElementById('loginBanner')
const webId = document.getElementById('webId')
let renderedApp: HTMLElement | null = null

if (loginBanner) {
  loginBanner.appendChild(UI.login.loginStatusBox(document, null, {}))
}

// const webIdToShow = 'https://testingsolidos.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sstratsianis.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sstratsianis2.solidcommunity.net/profile/card#me'
const webIdToShow = 'https://sharontest.solidcommunity.net/profile/card#me'
// const webIdToShow = 'https://sstratsianis.solidweb.org/profile/card#me'
// const webIdToShow = 'https://timea.solidcommunity.net/profile/card#me'

const urlParams = new URLSearchParams(window.location.search)
const webIdParam = urlParams.get('webid')
const resolvedWebId = webIdParam || webIdToShow

console.info('[profile-pane/dev] target webid', { webIdToShow: resolvedWebId })

function createSelectControl<T extends string>(
  id: string,
  labelText: string,
  options: Array<{ label: string, value: T }>,
  value: T,
  onChange: (nextValue: T) => void,
): HTMLLabelElement {
  const label = document.createElement('label')
  label.className = 'dev-toolbar__control'
  label.setAttribute('for', id)

  const text = document.createElement('span')
  text.className = 'dev-toolbar__label'
  text.textContent = labelText

  const select = document.createElement('select')
  select.id = id
  select.className = 'dev-toolbar__select'

  options.forEach((option) => {
    const optionElement = document.createElement('option')
    optionElement.value = option.value
    optionElement.textContent = option.label
    optionElement.selected = option.value === value
    select.appendChild(optionElement)
  })

  select.addEventListener('change', () => {
    onChange(select.value as T)
  })

  label.append(text, select)
  return label
}

function applyEnvironmentAttributes() {
  const root = document.documentElement

  root.dataset.layout = environment.layout
  root.dataset.inputMode = environment.inputMode

  if (environment.theme === 'dark') {
    root.dataset.theme = 'dark'
  } else {
    delete root.dataset.theme
  }
}

function renderApp() {
  applyEnvironmentAttributes()

  const app = pane.render(sym(resolvedWebId), context)
  const appRoot = document.getElementById('app')

  if (renderedApp) {
    renderedApp.replaceWith(app)
    renderedApp = app
    return
  }

  if (appRoot) {
    appRoot.replaceWith(app)
    renderedApp = app
  }
}

function rerenderWithEnvironment() {
  renderApp()
}

function mountDevToolbar() {
  if (!loginBanner) {
    return
  }

  const toolbar = document.createElement('div')
  toolbar.className = 'dev-toolbar'

  toolbar.append(
    createSelectControl(
      'dev-theme-select',
      'Theme',
      [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      environment.theme,
      (theme) => {
        updateEnvironment({ theme })
        rerenderWithEnvironment()
      }
    ),
    createSelectControl(
      'dev-layout-select',
      'Layout',
      [
        { label: 'Auto', value: 'auto' },
        { label: 'Desktop', value: 'desktop' },
        { label: 'Mobile', value: 'mobile' },
      ],
      environment.layoutPreference,
      (layoutPreference) => {
        updateEnvironment({ layoutPreference })
        rerenderWithEnvironment()
      }
    ),
    createSelectControl(
      'dev-input-select',
      'Input',
      [
        { label: 'Pointer', value: 'pointer' },
        { label: 'Touch', value: 'touch' },
      ],
      environment.inputMode,
      (inputMode) => {
        updateEnvironment({ inputMode })
        rerenderWithEnvironment()
      }
    )
  )

  loginBanner.appendChild(toolbar)
}

function bindEnvironmentListeners() {
  window.addEventListener('resize', () => {
    syncEnvironmentToWindow()
    rerenderWithEnvironment()
  })
}


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

  try {
    await fetcher.load(resolvedWebId)
  } catch (error) {
    console.warn('Initial profile load failed, rendering anyway:', error)
  } finally {
    syncEnvironmentToWindow()
    renderApp()
  }
}

mountDevToolbar()
bindEnvironmentListeners()
finishLogin()