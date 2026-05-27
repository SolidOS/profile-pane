jest.mock('@solid-data-modules/contacts-rdflib', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    listAddressBooks: jest.fn().mockResolvedValue({ publicUris: [], privateUris: [] }),
    createNewContact: jest.fn()
  }))
}))

import { context, subject } from './setup'
import {
  addMeToYourContactsDiv,
  createAddMeToYourContactsButton,
  saveNewContact
} from '../src/specialButtons/addContact/addMeToYourContacts'

describe('add-me-to-your-contacts functions', () => {
  describe('addMeToYourContactsDiv', () => {
    it('exists', () => {
      expect(addMeToYourContactsDiv).toBeInstanceOf(Function)
    })

    it('runs', async () => {
      await expect(addMeToYourContactsDiv(subject, context)).resolves.toBeTruthy()
    })
  })

  describe('createAddMeToYourContactsButton', () => {
    it('exists', () => {
      expect(createAddMeToYourContactsButton).toBeInstanceOf(Function)
    })

    it('runs', async () => {
      await expect(createAddMeToYourContactsButton(subject, context)).resolves.toBeTruthy()
    })
  })

  describe('saveNewContact', () => {
    it('exists', () => {
      expect(saveNewContact).toBeInstanceOf(Function)
    })
  })
})
