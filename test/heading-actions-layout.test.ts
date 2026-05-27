jest.mock('@solid-data-modules/contacts-rdflib', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    listAddressBooks: jest.fn(async () => ({ publicUris: [], privateUris: [] })),
    createNewContact: jest.fn()
  }))
}))

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { waitFor } from '@testing-library/dom'
import { parse, sym } from 'rdflib'
import { store } from 'solid-logic'
import pane from '../src/index'
import { context, fakeLogInAs } from './setup'

const viewedSubject = sym('https://alice.example/profile/card#me')
const viewedDoc = viewedSubject.doc()

const headingProfile = `
  @prefix : <#>.
  @prefix foaf: <http://xmlns.com/foaf/0.1/> .
  @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .

  :me
    a foaf:Person;
    foaf:name "Alice Example";
    vcard:role "Community Builder".
`

describe('heading action layout', () => {
  const baseStore = context.session.store as any

  beforeEach(() => {
    store.removeDocument(viewedDoc)
    parse(headingProfile, store, viewedDoc.uri, 'text/turtle')
    baseStore.fetcher = {
      ...baseStore.fetcher,
      load: jest.fn(async () => undefined)
    }
    baseStore.updater = {
      ...baseStore.updater,
      update: jest.fn(async () => undefined)
    }
    baseStore.whether = jest.fn().mockReturnValue(0)
  })

  it('renders the add-friends action in the heading top-right action container for authenticated viewers', async () => {
    fakeLogInAs(sym('https://viewer.example/profile/card#me'))

    const result = pane.render(viewedSubject, context)
    document.body.appendChild(result)

    await waitFor(() => {
      const headingSection = result.querySelector('[data-profile-section="heading"]') as HTMLElement | null
      expect(headingSection).not.toBeNull()

      const actions = headingSection?.querySelector('.profile__heading-actions') as HTMLElement | null
      expect(actions).not.toBeNull()
      expect(actions?.querySelector('.profile-friends-button__section')).not.toBeNull()
      expect(actions?.querySelector('solid-ui-button.profile__btn-friends')).not.toBeNull()

      const editAction = headingSection?.querySelector('.profile__heading-edit-action')
      expect(editAction).toBeNull()
    })

    result.remove()
  })

  it('renders the edit action in the heading top-right edit container for the owner', async () => {
    fakeLogInAs(viewedSubject)

    const result = pane.render(viewedSubject, context)
    document.body.appendChild(result)

    await waitFor(() => {
      const headingSection = result.querySelector('[data-profile-section="heading"]') as HTMLElement | null
      expect(headingSection).not.toBeNull()

      const editAction = headingSection?.querySelector('.profile__heading-edit-action') as HTMLElement | null
      expect(editAction).not.toBeNull()
      expect(editAction?.querySelector('solid-ui-button.profile__heading-action-button')).not.toBeNull()
      expect(editAction?.querySelector('[aria-label="Add or edit heading information"]')).not.toBeNull()

      const actions = headingSection?.querySelector('.profile__heading-actions')
      expect(actions).toBeNull()
    })

    result.remove()
  })
})