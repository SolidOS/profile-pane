jest.mock('@solid-data-modules/contacts-rdflib', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    listAddressBooks: jest.fn(async () => ({ publicUris: [], privateUris: [] })),
    readAddressBook: jest.fn(async () => null),
    createNewContact: jest.fn()
  }))
}))

import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render } from 'lit-html'
import { authn } from 'solid-logic'
import { sym } from 'rdflib'
import { renderHeadingSection } from '../../src/sections/heading/HeadingSection'
import { addMeToYourFriendsDiv } from '../../src/specialButtons/addMeToYourFriends'
import { addMeToYourFriendsButtonText } from '../../src/texts/buttonTexts'
import { context } from '../setup'

const ownerSubject = sym('https://janedoe.example/profile/card#me')
const authenticatedViewer = sym('https://alice.example/profile/card#me')

const profile = {
  entryNode: sym('https://example.com/profile#entry'),
  name: 'Jane Doe',
  nickname: 'Jane',
  imageSrc: '',
  location: 'Amsterdam',
  pronouns: 'She/Her',
  jobTitle: 'Engineer',
  orgName: 'SolidOS',
  primaryPhone: {
    entryNode: sym('https://example.com/profile#phone'),
    type: sym('http://www.w3.org/2006/vcard/ns#Home'),
    valueNode: sym('tel:+123456789')
  },
  primaryEmail: {
    entryNode: sym('https://example.com/profile#email'),
    type: sym('http://www.w3.org/2006/vcard/ns#Home'),
    valueNode: sym('mailto:jane@example.com')
  },
  primaryAddress: {
    entryNode: sym('https://example.com/profile#address')
  }
}

describe('Heading viewer actions integration', () => {
  const baseStore = context.session.store as any

  beforeEach(() => {
    jest.restoreAllMocks()
    baseStore.fetcher = {
      load: jest.fn(async () => undefined)
    }
    baseStore.updater = {
      update: jest.fn(async () => undefined)
    }
    baseStore.whether = jest.fn().mockReturnValue(0)
  })

  it('renders the real friends action for authenticated viewers', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(authenticatedViewer as any)

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(await renderHeadingSection(context, ownerSubject, profile as any, 'authenticated', 'desktop'), container)

    expect(container.querySelector('.profile-friends-button__section')).not.toBeNull()
    expect(container.textContent).toContain(addMeToYourFriendsButtonText)
    expect(container.querySelector('.profile-contacts-button__section')).toBeNull()
    expect(container.querySelector('.profile__heading-edit-action')).toBeNull()

    container.remove()
  })

  it('hides the friends button on mobile when the viewer is already a friend', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(authenticatedViewer as any)
    baseStore.whether = jest.fn().mockReturnValue(1)
    context.environment = { layout: 'mobile' } as any

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(await addMeToYourFriendsDiv(ownerSubject, context, 'authenticated'), container)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const friendsButtonSection = container.querySelector('.profile-friends-button__section')
    expect(friendsButtonSection).not.toBeNull()
    expect((friendsButtonSection as HTMLElement | null)?.hidden).toBe(true)

    container.remove()
    context.environment = undefined
  })

  it('renders only the edit action for owners', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(ownerSubject as any)

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(await renderHeadingSection(context, ownerSubject, profile as any, 'owner', 'desktop'), container)

    expect(container.querySelector('.profile__heading-edit-action')).not.toBeNull()
    expect(container.querySelector('.profile-contacts-button__section')).toBeNull()
    expect(container.querySelector('.profile-friends-button__section')).toBeNull()

    container.remove()
  })

  it('renders no actions for anonymous viewers', async () => {
    jest.spyOn(authn, 'currentUser').mockReturnValue(null as any)

    const container = document.createElement('div')
    document.body.appendChild(container)

    render(await renderHeadingSection(context, ownerSubject, profile as any, 'anonymous', 'desktop'), container)

    expect(container.querySelector('.profile__heading-edit-action')).toBeNull()
    expect(container.querySelector('.profile-contacts-button__section')).toBeNull()
    expect(container.querySelector('.profile-friends-button__section')).toBeNull()

    container.remove()
  })
})