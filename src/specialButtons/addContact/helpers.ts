import { DataBrowserContext } from 'pane-registry'
import { authn } from 'solid-logic'
import {
  contactExistsAlreadyButtonText,
  contactExistsAlreadyByNameButtonText,
  logInAddMeToYourContactsButtonText
} from '../../texts'
import { checkIfAnyUserLoggedIn } from '../../buttonsHelper'
import { AddressBookDetails, AddressBooksData, ContactData, GroupData } from './contactsTypes'
import { checkIfContactExistsByName, checkIfContactExistsByWebID } from './selectors'
import { plusIcon } from '../../icons-svg/profileIcons'

const addAsContactButtonText = 'Add as Contact'

function setAddToContactsButtonContent(button: HTMLElement | null, label: string, showIcon = false): void {
  if (!button) return

  const { ownerDocument } = button
  const content: Node[] = []

  if (showIcon) {
    const iconWrapper = ownerDocument.createElement('span')
    iconWrapper.className = 'profile__btn-contacts-icon inline-flex-row justify-center'
    iconWrapper.setAttribute('aria-hidden', 'true')
    renderIconIntoElement(iconWrapper)
    content.push(iconWrapper)
  }

  const labelWrapper = ownerDocument.createElement('span')
  labelWrapper.className = 'profile__btn-contacts-label'
  labelWrapper.textContent = label
  content.push(labelWrapper)

  button.replaceChildren(...content)
}

function renderIconIntoElement(element: HTMLElement): void {
  const svgTemplate = (plusIcon as unknown as { strings?: string[], values?: unknown[] })
  if ('innerHTML' in element && svgTemplate && Array.isArray(svgTemplate.strings)) {
    element.innerHTML = svgTemplate.strings.join('')
  }
}

function refreshButton(
  context: DataBrowserContext,
  addressBooksData: AddressBooksData,
  contactData: ContactData
) {
  const me = authn.currentUser()
  const button = context.dom.getElementById('add-to-contacts-button')
  if (checkIfAnyUserLoggedIn(me)) {
    const contactExistsByWebID = checkIfContactExistsByWebID(addressBooksData, contactData.webID)
    const contactExistsByName = checkIfContactExistsByName(addressBooksData, contactData.name)
    if (contactExistsByWebID) {
      setAddToContactsButtonContent(button, contactExistsAlreadyButtonText)
      button.onclick = null
      button.setAttribute('disabled', '')
    } else if (contactExistsByName) {
      setAddToContactsButtonContent(button, contactExistsAlreadyByNameButtonText)
      button.removeAttribute('disabled')
    } else {
      setAddToContactsButtonContent(button, addAsContactButtonText, true)
    }
  } else {
    setAddToContactsButtonContent(button, logInAddMeToYourContactsButtonText)
  }
}

function addGroupToAddressBookData(
  addressBooksData: AddressBooksData,
  addressBookUri: string,
  group: GroupData
): boolean {
  const publicAddressBook = addressBooksData.public.get(addressBookUri)
  if (publicAddressBook) {
    const groupExists = publicAddressBook.groups.some((existingGroup) => existingGroup.uri === group.uri)
    if (!groupExists) {
      addressBooksData.public.set(addressBookUri, {
        ...publicAddressBook,
        groups: [...publicAddressBook.groups, group]
      })
    }
    return true
  }

  const privateAddressBook = addressBooksData.private.get(addressBookUri)
  if (privateAddressBook) {
    const groupExists = privateAddressBook.groups.some((existingGroup) => existingGroup.uri === group.uri)
    if (!groupExists) {
      addressBooksData.private.set(addressBookUri, {
        ...privateAddressBook,
        groups: [...privateAddressBook.groups, group]
      })
    }
    return true
  }

  return false
}

function addAddressBookToAddressBooksData(
  addressBooksData: AddressBooksData,
  addressBookUri: string,
  addressBook: AddressBookDetails,
  visibility: 'public' | 'private' = 'private'
): AddressBooksData {
  const nextAddressBooksData: AddressBooksData = {
    public: new Map(addressBooksData.public),
    private: new Map(addressBooksData.private),
    contactWebIDs: addressBooksData.contactWebIDs,
    contactNames: addressBooksData.contactNames
  }

  const existingAddressBook = nextAddressBooksData.public.get(addressBookUri) || nextAddressBooksData.private.get(addressBookUri)
  const nextAddressBook = existingAddressBook
    ? {
        ...existingAddressBook,
        ...addressBook,
        groups: addressBook.groups.length ? addressBook.groups : existingAddressBook.groups,
        contacts: addressBook.contacts.length ? addressBook.contacts : existingAddressBook.contacts
      }
    : addressBook

  nextAddressBooksData.public.delete(addressBookUri)
  nextAddressBooksData.private.delete(addressBookUri)
  nextAddressBooksData[visibility].set(addressBookUri, nextAddressBook)

  return nextAddressBooksData
}

export {
  refreshButton,
  addGroupToAddressBookData,
  addAddressBookToAddressBooksData
}