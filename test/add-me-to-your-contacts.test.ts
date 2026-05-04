jest.mock('@solid-data-modules/contacts-rdflib', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    listAddressBooks: jest.fn().mockResolvedValue({ publicUris: [], privateUris: [] }),
    createNewContact: jest.fn()
  }))
}))

import { context, fakeLogInAs, subject } from './setup'
import pane from '../src'
import { queryByText, waitFor } from '@testing-library/dom'
import { sym } from 'rdflib'
import { addMeToYourContactsButtonText } from '../src/texts'

describe('add-me-to-your-contacts pane', () => {
  beforeEach(() => {
    fakeLogInAs(subject)
  })

  it('renders the add-to-contacts button for an authenticated non-owner viewer', async () => {
    const viewedSubject = sym('https://alice.example/profile/card#me')
    const result = pane.render(viewedSubject, context)

    await waitFor(() => {
      expect(result.querySelector('#add-to-contacts-button')).not.toBeNull()
    })
  })

  it('does not render the add-to-contacts button for the profile owner', () => {
    const result = pane.render(subject, context)

    expect(queryByText(result, addMeToYourContactsButtonText.toUpperCase())).toBeNull()
  })
})
