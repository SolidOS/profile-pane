vi.mock('@solid-data-modules/contacts-rdflib', () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() => ({
    listAddressBooks: vi.fn(async () => ({ publicUris: [], privateUris: [] })),
    createNewContact: vi.fn()
  }))
}))

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, sym } from 'rdflib'
import { store } from 'solid-logic'
import pane from '../src/index'
import { context, fakeLogInAs } from './setup'
import { waitForSelector } from './helpers/dom'

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
      load: vi.fn(async () => undefined)
    }
    baseStore.updater = {
      ...baseStore.updater,
      update: vi.fn(async () => undefined)
    }
    baseStore.whether = vi.fn().mockReturnValue(0)
  })

  it('renders the add-friends action in the heading top-right action container for authenticated viewers', async () => {
    fakeLogInAs(sym('https://viewer.example/profile/card#me'))

    const result = pane.render(viewedSubject, context)
    document.body.appendChild(result)

    const headingSection = await waitForSelector<HTMLElement>(result, '[data-profile-section="heading"]')
    const actions = headingSection.querySelector<HTMLElement>('.profile__heading-actions')

    expect(actions).not.toBeNull()
    expect(actions?.querySelector('.profile-friends-button__section')).not.toBeNull()
    expect(actions?.querySelector('solid-ui-button.profile__btn-friends')).not.toBeNull()
    expect(headingSection.querySelector('.profile__heading-edit-action')).toBeNull()

    result.remove()
  })

  it('renders the edit action in the heading top-right edit container for the owner', async () => {
    fakeLogInAs(viewedSubject)

    const result = pane.render(viewedSubject, context)
    document.body.appendChild(result)

    const headingSection = await waitForSelector<HTMLElement>(result, '[data-profile-section="heading"]')
    const editAction = headingSection.querySelector<HTMLElement>('.profile__heading-edit-action')

    expect(editAction).not.toBeNull()
    expect(editAction?.querySelector('solid-ui-button.profile-section-collapsible__edit-button')).not.toBeNull()
    expect(editAction?.querySelector('[aria-label="Add or edit heading information"]')).not.toBeNull()
    expect(headingSection.querySelector('.profile__heading-actions')).toBeNull()

    result.remove()
  })
})