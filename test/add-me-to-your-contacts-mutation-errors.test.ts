import { fireEvent, waitFor } from '@testing-library/dom'
import { sym } from 'rdflib'

import { context, fakeLogInAs, subject } from './setup'
import { createAddressBookContactCreationDialog, createAddressBookContactCreationFooter } from '../src/specialButtons/addContact/ContactCreationDialog'
import { closeSharedDialog, openInputDialog } from '../src/ui/dialog'
import {
  errorNotExistsAddressBookUri,
  groupIsRequired
} from '../src/texts'
import type { AddressBooksData, ContactData } from '../src/specialButtons/addContact/contactsTypes'

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

function mountDialog() {
  document.body.innerHTML = ''

  const form = createAddressBookContactCreationDialog(
    context,
    createContactsModule() as any,
    createContactData(),
    createAddressBooksData()
  )

  const footer = createAddressBookContactCreationFooter(
    context,
    createContactsModule() as any,
    createAddressBooksData(),
    createContactData()
  )

  void openInputDialog({
    title: 'Add contact to address book',
    dom: document,
    form,
    headerAction: { type: 'none' }
  })

  const buttonsContainer = document.querySelector('#modal-buttons') as HTMLDivElement | null
  if (buttonsContainer) {
    const sharedButtons = Array.from(buttonsContainer.querySelectorAll(':scope > solid-ui-button')) as HTMLElement[]
    sharedButtons.forEach((button) => {
      button.hidden = true
      button.setAttribute('aria-hidden', 'true')
    })

    buttonsContainer.appendChild(footer)
  }

  return form
}

function getErrorMessage(): HTMLElement {
  const error = document.querySelector('#profile-modal #modal-error') as HTMLElement | null
  if (!error) throw new Error('Expected add-to-contact error message element to exist.')
  return error
}

describe('add-to-contact dialog validation', () => {
  beforeEach(() => {
    fakeLogInAs(subject)
  })

  afterEach(() => {
    closeSharedDialog()
    document.body.innerHTML = ''
    jest.clearAllMocks()
  })

  it('shows a validation error when adding a contact without selecting a group', async () => {
    mountDialog()

    const addressBookButton = document.getElementById(addressBookUri) as HTMLElement
    fireEvent.click(addressBookButton)

    const addContactButton = document.getElementById('contacts-submit-contact-button') as HTMLElement
    fireEvent.click(addContactButton)

    await waitFor(() => {
      expect(getErrorMessage().textContent).toBe(groupIsRequired)
    })
  })

  it('shows a validation error when the address-book URI is blank', async () => {
    mountDialog()

    const launchUriButton = document.getElementById('contacts-addressbook-uri-entry-button') as HTMLElement
    fireEvent.click(launchUriButton)

    const uriForm = document.getElementById('contacts-address-uri-entry-form') as HTMLFormElement
    uriForm.dispatchEvent(new Event('submit', { bubbles: false, cancelable: true }))

    await waitFor(() => {
      expect(getErrorMessage().textContent).toBe(errorNotExistsAddressBookUri)
    })
  })

  it('shows inline validation when the address-book name contains invalid characters', async () => {
    mountDialog()

    const launchAddressBookButton = document.getElementById('contacts-create-addressbook-button') as HTMLElement
    fireEvent.click(launchAddressBookButton)

    fireEvent.input(document.getElementById('addressBookContainerInput') as HTMLInputElement, {
      target: { value: 'friends' }
    })
    fireEvent.input(document.getElementById('groupNameInput') as HTMLInputElement, {
      target: { value: 'Friends Group' }
    })
    fireEvent.input(document.getElementById('addressBookNameInput') as HTMLInputElement, {
      target: { value: '!!!' }
    })

    const validationMessage = document.querySelector('#new-addressbook-form .contacts-dialog__validation') as HTMLElement

    await waitFor(() => {
      expect(validationMessage.textContent).toBe('Only letters, numbers, and spaces are allowed.')
      expect(validationMessage.getAttribute('aria-hidden')).toBe('false')
    })
  })
})