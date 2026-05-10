import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, waitFor } from '@testing-library/dom'

import { createAddressBookContactCreationDialog, handleContactExistsByName } from '../src/specialButtons/addContact/ContactCreationDialog'
import type { AddressBooksData, ContactData } from '../src/specialButtons/addContact/contactsTypes'
import { runAxe } from './helpers/runAxe'
import { context, fakeLogInAs, subject } from './setup'

type MockContactsModule = {
  createNewContact: jest.Mock
}

const addressBookUri = 'https://janedoe.example/contacts/index.ttl#this'
const groupUri = 'https://janedoe.example/contacts/Group/friends.ttl#this'

function createAddressBooksData(): AddressBooksData {
  return {
    public: new Map(),
    private: new Map([
      [addressBookUri, {
        name: 'Friends',
        groups: [{ name: 'Friends Group', uri: groupUri }],
        contacts: []
      }]
    ]),
    contactWebIDs: new Map(),
    contactNames: new Map()
  }
}

function createContactData(): ContactData {
  return {
    name: 'Jane Doe',
    webID: 'https://jane.example/profile/card#me',
    emails: [],
    phoneNumbers: []
  }
}

function createContactsModule(): MockContactsModule {
  return {
    createNewContact: jest.fn()
  }
}

function mountDialog(): HTMLFormElement {
  document.body.innerHTML = ''

  const form = createAddressBookContactCreationDialog(
    context,
    createContactsModule() as any,
    createContactData(),
    createAddressBooksData()
  )

  document.body.appendChild(form)
  return form
}

describe('Add me to your contacts accessibility', () => {
  beforeEach(() => {
    fakeLogInAs(subject)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  it('has no accessibility violations for the chooser dialog', async () => {
    const form = mountDialog()

    expect(form.getAttribute('aria-describedby')).toBe('contacts-dialog-description')

    const results = await runAxe(form)
    expect(results.violations.length).toBe(0)
  })

  it('associates the address-book inline validation message with its inputs', () => {
    const form = mountDialog()

    const createButton = form.querySelector('#contacts-create-addressbook-button') as HTMLElement
    fireEvent.click(createButton)

    const validationMessage = form.querySelector('#contacts-addressbook-validation-message') as HTMLElement
    const addressBookNameInput = form.querySelector('#addressBookNameInput') as HTMLInputElement
    const addressBookContainerInput = form.querySelector('#addressBookContainerInput') as HTMLInputElement
    const groupNameInput = form.querySelector('#groupNameInput') as HTMLInputElement

    expect(validationMessage).not.toBeNull()
    expect(addressBookNameInput.getAttribute('aria-describedby')).toBe('contacts-addressbook-validation-message')
    expect(addressBookContainerInput.getAttribute('aria-describedby')).toBe('contacts-addressbook-validation-message')
    expect(groupNameInput.getAttribute('aria-describedby')).toBe('contacts-addressbook-validation-message')

    fireEvent.input(addressBookNameInput, { target: { value: 'Bad@@ Name!!' } })

    expect(addressBookNameInput.getAttribute('aria-invalid')).toBe('true')
    expect(validationMessage.textContent).toBe('Only letters, numbers, and spaces are allowed.')
    expect(validationMessage.getAttribute('aria-hidden')).toBe('false')
  })

  it('announces shared errors accessibly and remains axe-clean when an error is visible', async () => {
    const form = mountDialog()

    const addressBookButton = form.querySelector(`#${CSS.escape(addressBookUri)}`) as HTMLElement | null
    if (addressBookButton) {
      fireEvent.click(addressBookButton)
    } else {
      fireEvent.click(document.getElementById(addressBookUri) as HTMLElement)
    }

    fireEvent.click(form.querySelector('#contacts-submit-contact-button') as HTMLElement)

    const errorSection = form.querySelector('#error-display-section') as HTMLElement
    const errorMessage = form.querySelector('#error-display-message') as HTMLElement

    await waitFor(() => {
      expect(errorSection.classList.contains('contacts-dialog__error--visible')).toBe(true)
      expect(errorSection.getAttribute('role')).toBe('alert')
      expect(errorSection.getAttribute('aria-live')).toBe('assertive')
      expect(errorSection.getAttribute('aria-atomic')).toBe('true')
      expect(errorSection.getAttribute('aria-hidden')).toBe('false')
      expect(document.activeElement).toBe(errorSection)
      expect(errorMessage.textContent).toBe('You need to either pick a group or enter one.')
    })

    const results = await runAxe(form)
    expect(results.violations.length).toBe(0)
  })

  it('treats the inline contact-exists confirmation as a modal alertdialog', async () => {
    const form = mountDialog()

    const handled = handleContactExistsByName(
      context,
      createAddressBooksData(),
      createContactData(),
      'https://janedoe.example/contacts/Person/alice.ttl#this',
      false
    )

    expect(handled).toBe(true)

    const popup = form.querySelector('.contacts-dialog__contact-exists') as HTMLElement
    const overlay = form.querySelector('#contacts-popup-overlay') as HTMLElement
    const description = form.querySelector('.contacts-dialog__description') as HTMLElement
    const body = form.querySelector('.contacts-dialog__body') as HTMLElement
    const footer = form.querySelector('.contacts-dialog__footer') as HTMLElement

    await waitFor(() => {
      expect(popup.getAttribute('role')).toBe('alertdialog')
      expect(popup.getAttribute('aria-modal')).toBe('true')
      expect(popup.getAttribute('tabindex')).toBe('-1')
      expect(description.getAttribute('aria-hidden')).toBe('true')
      expect(body.getAttribute('aria-hidden')).toBe('true')
      expect(footer.getAttribute('aria-hidden')).toBe('true')
      expect(overlay.getAttribute('aria-hidden')).toBe('true')
      expect(overlay.hasAttribute('role')).toBe(false)
      expect(document.activeElement).toBe(popup)
    })

    const results = await runAxe(form)
    expect(results.violations.length).toBe(0)
  })
})