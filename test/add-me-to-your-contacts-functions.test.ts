import { context, subject } from './setup'
import {
  addMeToYourContactsDiv,
  createAddMeToYourContactsButton,
  saveNewContact
} from '../src/addMeToYourContacts'

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
