/** Project-local: currently unused component. Keep temporarily; do not add new usage. */
import { DataBrowserContext } from 'pane-registry'
import { NamedNode } from 'rdflib'
import { ns, widgets, icons } from 'solid-ui'
import { friendsHeadingText } from '../texts'
import { saveNewThing } from '../specialButtons/addMeToYourFriends'
import '../styles/editProfile.css'
import { store } from 'solid-logic'
import {
  clearPreviousMessage, complain
} from '../buttonsHelper'
import { isAWebID, refresh } from './editProfilePresenter'

const GREEN_PLUS = icons.iconBase + 'noun_34653_green.svg'

export function EditFriendsSection(context: DataBrowserContext, me: NamedNode, editableProfile: NamedNode | null) {
  const section = context.dom.createElement('section')
  section.setAttribute('aria-labelledby', 'edit-profile-friends-heading')
  section.classList.add('profileSection', 'section-bg')

  const header = context.dom.createElement('header')
  header.classList.add('text-center', 'mb-md')

  const heading = context.dom.createElement('h2')
  heading.id = 'edit-profile-friends-heading'
  heading.classList.add('section-title')
  heading.textContent = friendsHeadingText

  header.appendChild(heading)
  section.appendChild(header)

  if (editableProfile) {
    let plusButtonDiv = context.dom.createElement('div')
    plusButtonDiv.classList.add('add-friend-button-container')

    createAddButton(plusButtonDiv, context)
    section.appendChild(plusButtonDiv)
  }

  const attachmentOuter = section.appendChild(context.dom.createElement('table'))
  attachmentOuter.classList.add('edit-friends-attachment-outer')
  const attachmentOne = attachmentOuter.appendChild(context.dom.createElement('tr'))
  const attachmentRight = attachmentOne.appendChild(context.dom.createElement('td'))
  const attachmentTable = attachmentRight.appendChild(context.dom.createElement('table'))
  attachmentTable.classList.add('attachmentTable', 'table', 'table-striped', 'table-hover')

  ;(attachmentOuter as any).refresh = refresh(context.dom, attachmentTable, me, editableProfile, ns.foaf('knows')) // Participate in downstream changes

  refresh(context.dom, attachmentTable, me, editableProfile, ns.foaf('knows'))

  function createAddButton(buttonContainer: HTMLDivElement, context: DataBrowserContext) {

    const plus = buttonContainer.appendChild(widgets.button(context.dom, GREEN_PLUS, 'Add a friend', greenButtonHandler))
    const predicate = ns.foaf('knows')

    plus.setAttribute('class', 'add-button')
    plus.setAttribute('aria-label', 'Add a friend')
    const span = context.dom.createElement('span')
    span.textContent = 'Add a friend' // for screen readers
    span.setAttribute('class','span')
    buttonContainer.appendChild(span)

    async function greenButtonHandler (_event) {
      const webid = await widgets.askName(context.dom, store, buttonContainer, predicate, undefined, 'WebID of the friend you')

      if (!webid) {
        return
      }

      try {
        new URL(webid)
      } catch {
        complain(buttonContainer, context, 'Not a URL')
        return
      }

      try {
        await store.fetcher.load(store.sym(webid))
      } catch {
        complain(buttonContainer, context, 'Not a valid WebID')
        return
      }

      if (!isAWebID(store.sym(webid))) {
        complain(buttonContainer, context, 'WebID does not seem to exist')
        return
      }

      return saveNewThing(webid, context, predicate)
        .then(() => {
          refresh(context.dom, attachmentTable, me, editableProfile, predicate) // Update the button state after adding a friend
        })
        .catch((error) => {
          clearPreviousMessage(buttonContainer)
          complain(buttonContainer, context, error)
        })
    }
  }

  return section
}

