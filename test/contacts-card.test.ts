jest.mock('../src/specialButtons/addContact/helpers', () => ({
  addGroupToAddressBookData: jest.fn(),
  refreshButton: jest.fn()
}))

jest.mock('../src/specialButtons/addContact/selectors', () => ({
  checkIfContactExistsByName: jest.fn(() => null),
  checkIfContactExistsByWebID: jest.fn(() => false)
}))

jest.mock('../src/specialButtons/addContact/mutations', () => ({
  addANewAddressBookUriToAddressBooks: jest.fn(),
  addWebIDToExistingContact: jest.fn(),
  createContactInAddressBook: jest.fn(),
  handleAddressBookCreation: jest.fn()
}))

jest.mock('contacts-pane', () => ({
  __esModule: true,
  default: {},
  saveNewGroup: jest.fn()
}))

jest.mock('../src/buttonsHelper', () => ({
  clearPreviousMessage: jest.fn(),
  complain: jest.fn(),
  mention: jest.fn()
}))

import { waitFor } from '@testing-library/dom'

jest.mock('../src/specialButtons/addContact/contactsErrors', () => {
  const actual = jest.requireActual('../src/specialButtons/addContact/contactsErrors')
  return {
    ...actual,
    addErrorToErrorDisplay: jest.fn(),
    checkAndAddErrorToDisplay: jest.fn(),
    checkAndRemoveErrorDisplay: jest.fn()
  }
})

import { createAddressBookContactCreationFooter, createAddressBookUriSelectorDialog } from '../src/specialButtons/addContact/ContactCreationDialog'
import { closeSharedDialog, openInputDialog } from '../src/ui/dialog'

describe('ContactCreationDialog', () => {
  const context = { dom: document } as any
  const contactsModule = {} as any
  const contactData = {
    name: 'Alice',
    webID: 'https://alice.example/profile#me',
    emails: [],
    phoneNumbers: []
  } as any

  const addressBooksData = {
    public: new Map(),
    private: new Map(),
    contactWebIDs: new Map(),
    contactNames: new Map()
  } as any

  beforeEach(() => {
    document.body.innerHTML = ''
    const addButton = document.createElement('button')
    addButton.id = 'add-to-contacts-button'
    document.body.appendChild(addButton)

    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'add-to-contacts-button-container'
    document.body.appendChild(buttonContainer)
  })

  afterEach(() => {
    closeSharedDialog()
  })

  function mountSharedDialog() {
    const dialog = createAddressBookUriSelectorDialog(context, contactsModule, contactData, addressBooksData)
    const footer = createAddressBookContactCreationFooter(context, contactsModule, addressBooksData, contactData)

    void openInputDialog({
      title: 'Add contact to address book',
      dom: document,
      form: dialog,
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

    return dialog
  }

  it('opens the new address-book form from create button', () => {
    const dialog = mountSharedDialog()

    const createButton = dialog.querySelector('#contacts-create-addressbook-button') as HTMLButtonElement
    expect(createButton).toBeTruthy()

    createButton.click()

    const newForm = dialog.querySelector('#new-addressbook-form')
    expect(newForm).toBeTruthy()
    expect(newForm?.closest('#contacts-inline-panel-region')).toBeTruthy()
    expect((document.getElementById('contacts-submit-contact-button') as HTMLButtonElement | null)?.disabled).toBe(true)
  })

  it('opens the address-book URI flow inside the inline panel region', () => {
    const dialog = mountSharedDialog()

    const uriButton = dialog.querySelector('#contacts-addressbook-uri-entry-button') as HTMLButtonElement
    expect(uriButton).toBeTruthy()

    uriButton.click()

    const uriPanel = dialog.querySelector('#contacts-addressbook-uri-entry')
    expect(uriPanel).toBeTruthy()
    expect(uriPanel?.closest('#contacts-inline-panel-region')).toBeTruthy()
  })

  it('renders chooser content with footer actions', async () => {
    const dialog = mountSharedDialog()

    expect(dialog.querySelector('.contacts-dialog__description')?.textContent).toContain('Choose an address book and group')

    await waitFor(() => {
      expect(document.getElementById('contacts-submit-contact-button')?.textContent).toContain('Add Contact')
      expect(Array.from(document.querySelectorAll('#modal-buttons button, #modal-buttons solid-ui-button')).some((button) => button.textContent?.trim() === 'Cancel')).toBe(true)
    })
  })

  it('sanitizes invalid characters and toggles validation message visibility', () => {
    const dialog = mountSharedDialog()

    const createButton = dialog.querySelector('#contacts-create-addressbook-button') as HTMLButtonElement
    createButton.click()

    const nameInput = dialog.querySelector('#addressBookNameInput') as HTMLInputElement
    const validationMessage = dialog.querySelector('.contacts-dialog__validation') as HTMLElement

    expect(nameInput).toBeTruthy()
    expect(validationMessage).toBeTruthy()

    nameInput.value = 'Bad@@ Name!!'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(nameInput.value).toBe('Bad Name')
    expect(validationMessage.classList.contains('contacts-dialog__validation--visible')).toBe(true)
    expect(validationMessage.getAttribute('aria-hidden')).toBe('false')

    nameInput.value = 'Good Name'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(validationMessage.classList.contains('contacts-dialog__validation--visible')).toBe(false)
    expect(validationMessage.getAttribute('aria-hidden')).toBe('true')
  })

  it('preserves spaces while typing in address book inputs', () => {
    const dialog = mountSharedDialog()

    const createButton = dialog.querySelector('#contacts-create-addressbook-button') as HTMLButtonElement
    createButton.click()

    const nameInput = dialog.querySelector('#addressBookNameInput') as HTMLInputElement

    nameInput.value = 'My Address Book '
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(nameInput.value).toBe('My Address Book ')
  })
})
