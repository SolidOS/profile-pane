jest.mock('../src/contactsHelpers', () => ({
  addANewAddressBookUriToAddressBooks: jest.fn(),
  addGroupToAddressBookData: jest.fn(),
  addWebIDToExistingContact: jest.fn(),
  checkIfContactExistsByName: jest.fn(() => null),
  checkIfContactExistsByWebID: jest.fn(() => false),
  createContactInAddressBook: jest.fn(),
  handleAddressBookCreation: jest.fn(),
  refreshButton: jest.fn()
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

jest.mock('../src/contactsErrors', () => ({
  addErrorToErrorDisplay: jest.fn(),
  checkAndAddErrorDisplay: jest.fn()
}))

import { createAddressBookUriSelectorDialog } from '../src/ContactsCard'

describe('ContactsCard', () => {
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

  it('opens the new address-book form from create button', () => {
    const dialog = createAddressBookUriSelectorDialog(context, contactsModule, contactData, addressBooksData)
    document.body.appendChild(dialog)

    const createButton = dialog.querySelector('#contacts-create-addressbook-button') as HTMLButtonElement
    expect(createButton).toBeTruthy()

    createButton.click()

    const newForm = dialog.querySelector('#new-addressbook-form')
    expect(newForm).toBeTruthy()
  })

  it('sanitizes invalid characters and toggles validation message visibility', () => {
    const dialog = createAddressBookUriSelectorDialog(context, contactsModule, contactData, addressBooksData)
    document.body.appendChild(dialog)

    const createButton = dialog.querySelector('#contacts-create-addressbook-button') as HTMLButtonElement
    createButton.click()

    const nameInput = dialog.querySelector('#addressBookNameInput') as HTMLInputElement
    const validationMessage = dialog.querySelector('.contactsInputValidationMessage') as HTMLElement

    expect(nameInput).toBeTruthy()
    expect(validationMessage).toBeTruthy()

    nameInput.value = 'Bad@@ Name!!'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(nameInput.value).toBe('Bad Name')
    expect(validationMessage.classList.contains('contactsInputValidationMessage--visible')).toBe(true)
    expect(validationMessage.getAttribute('aria-hidden')).toBe('false')

    nameInput.value = 'Good Name'
    nameInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(validationMessage.classList.contains('contactsInputValidationMessage--visible')).toBe(false)
    expect(validationMessage.getAttribute('aria-hidden')).toBe('true')
  })
})
