jest.mock('contacts-pane', () => ({
	__esModule: true,
	default: {
		mintNew: jest.fn()
	},
	addWebIDToContacts: jest.fn()
}))

jest.mock('../src/specialButtons/addContact/contactsErrors', () => ({
	addErrorToErrorDisplay: jest.fn()
}))

import {
  getContactData,
	checkIfContactExistsByName,
	checkIfContactExistsByWebID
} from '../src/specialButtons/addContact/selectors'
import {
	createContactInAddressBook,
	addWebIDToExistingContact,
	updateAddressBookName
} from '../src/specialButtons/addContact/mutations'
import { addGroupToAddressBookData } from '../src/specialButtons/addContact/helpers'
import { namedNode, sym } from 'rdflib'
import { addWebIDToContacts } from 'contacts-pane'
import { addErrorToErrorDisplay } from '../src/specialButtons/addContact/contactsErrors'

describe('contactsHelpers', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getContactData', () => {
		it('exists', () => {
			expect(getContactData).toBeInstanceOf(Function)
		})

		it('reads nickname and preferred pronouns from the profile subject', async () => {
			const subject = sym('https://alice.example/profile/card#me')
			const store = {
				anyValue: jest.fn((node, predicate) => {
					if (predicate.value.endsWith('foaf/0.1/nick')) return 'Ali'
					if (predicate.value.endsWith('preferredSubjectPronoun')) return 'they'
					if (predicate.value.endsWith('preferredObjectPronoun')) return 'them'
					if (predicate.value.endsWith('preferredRelativePronoun')) return 'theirs'
					return null
				}),
				each: jest.fn().mockReturnValue([]),
				any: jest.fn()
			} as any

			const contactData = await getContactData(store, subject)

			expect(contactData.nickname).toBe('Ali')
			expect(contactData.preferredSubjectPronoun).toBe('they')
			expect(contactData.preferredObjectPronoun).toBe('them')
			expect(contactData.preferredRelativePronoun).toBe('theirs')
		})
	})

	describe('createContactInAddressBook', () => {
		it('exists', () => {
			expect(createContactInAddressBook).toBeInstanceOf(Function)
		})

		it('persists nickname and preferred pronouns when present', async () => {
			const createdContactUri = 'https://pod.example/address-book/index.ttl#new-contact'
			const fetcherLoad = jest.fn().mockResolvedValue(undefined)
			const updaterUpdate = jest.fn().mockResolvedValue(undefined)
			const bnode = jest.fn(() => namedNode('https://pod.example/address-book/index.ttl#webid-node'))
			const context = {
				session: {
					store: {
						fetcher: { load: fetcherLoad },
						updater: { update: updaterUpdate },
						bnode,
						each: jest.fn().mockReturnValue([]),
						statementsMatching: jest.fn().mockReturnValue([])
					}
				}
			} as any

			const contactsModule = {
				createNewContact: jest.fn().mockResolvedValue(createdContactUri)
			} as any

			const contactData = {
				name: 'Alice',
				webID: 'https://alice.example/profile#me',
				emails: [],
				phoneNumbers: [],
				nickname: 'Ali',
				preferredSubjectPronoun: 'they',
				preferredObjectPronoun: 'them',
				preferredRelativePronoun: 'theirs'
			} as any

			await createContactInAddressBook(context, contactsModule, contactData, {
				addressBookUri: 'https://pod.example/address-book/index.ttl#this',
				groupUris: ['https://pod.example/address-book/index.ttl#friends']
			})

			expect(addWebIDToContacts).not.toHaveBeenCalled()
			expect(updaterUpdate).toHaveBeenCalledTimes(2)

			const [, webIdInsertions] = updaterUpdate.mock.calls[0]
			expect(webIdInsertions.map((statement) => statement.predicate.value)).toEqual([
				'http://www.w3.org/2006/vcard/ns#url',
				'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
				'http://www.w3.org/2006/vcard/ns#value'
			])

			const [, insertions] = updaterUpdate.mock.calls[1]
			const predicates = insertions.map((statement) => statement.predicate.value)
			expect(predicates).toContain('http://xmlns.com/foaf/0.1/nick')
			expect(predicates).toContain('http://www.w3.org/ns/solid/terms#preferredSubjectPronoun')
			expect(predicates).toContain('http://www.w3.org/ns/solid/terms#preferredObjectPronoun')
			expect(predicates).toContain('http://www.w3.org/ns/solid/terms#preferredRelativePronoun')
		})

		it('skips detail writes when there are no detail fields', async () => {
			const context = {
				session: {
					store: {
						fetcher: { load: jest.fn().mockResolvedValue(undefined) },
						updater: { update: jest.fn().mockResolvedValue(undefined) }
					}
				}
			} as any

			const contactsModule = {
				createNewContact: jest.fn().mockResolvedValue('https://pod.example/address-book/index.ttl#new-contact')
			} as any

			await createContactInAddressBook(context, contactsModule, {
				name: 'Alice',
				webID: 'https://alice.example/profile#me',
				emails: [],
				phoneNumbers: []
			} as any, {
				addressBookUri: 'https://pod.example/address-book/index.ttl#this',
				groupUris: ['https://pod.example/address-book/index.ttl#friends']
			})

			expect(context.session.store.updater.update).not.toHaveBeenCalled()
		})
	})

	describe('checkIfContactExistsByWebID', () => {
		it('exists', () => {
			expect(checkIfContactExistsByWebID).toBeInstanceOf(Function)
		})

		it('returns true when trimmed webID exists in map', () => {
			const addressBooksData = {
				contactWebIDs: new Map([['https://alice.example/profile#me', 'https://pod.example/contacts#alice']])
			} as any

			expect(checkIfContactExistsByWebID(addressBooksData, '  https://alice.example/profile#me  ')).toBe(true)
		})

		it('returns false for empty or missing webID', () => {
			const addressBooksData = {
				contactWebIDs: new Map([['https://alice.example/profile#me', 'https://pod.example/contacts#alice']])
			} as any

			expect(checkIfContactExistsByWebID(addressBooksData, '')).toBe(false)
			expect(checkIfContactExistsByWebID(addressBooksData, '   ')).toBe(false)
			expect(checkIfContactExistsByWebID(addressBooksData, null as any)).toBe(false)
			expect(checkIfContactExistsByWebID(addressBooksData, undefined as any)).toBe(false)
		})
	})

	describe('checkIfContactExistsByName', () => {
		it('exists', () => {
			expect(checkIfContactExistsByName).toBeInstanceOf(Function)
		})

		it('matches contact names case-insensitively and ignores spaces', () => {
			const addressBooksData = {
				contactNames: new Map([
					['Alice Smith', 'https://pod.example/contacts#alice'],
					['Bob', 'https://pod.example/contacts#bob']
				])
			} as any

			expect(checkIfContactExistsByName(addressBooksData, '  alice   smith ')).toBe('https://pod.example/contacts#alice')
			expect(checkIfContactExistsByName(addressBooksData, 'BOB')).toBe('https://pod.example/contacts#bob')
		})

		it('returns null when no matching name exists', () => {
			const addressBooksData = {
				contactNames: new Map([['Alice Smith', 'https://pod.example/contacts#alice']])
			} as any

			expect(checkIfContactExistsByName(addressBooksData, 'Charlie')).toBeNull()
		})
	})

	describe('addGroupToAddressBookData', () => {
		it('exists', () => {
			expect(addGroupToAddressBookData).toBeInstanceOf(Function)
		})

		it('adds a new group to a public address book and returns true', () => {
			const addressBookUri = 'https://pod.example/address-book/#this'
			const group = { name: 'Friends', uri: 'https://pod.example/address-book/groups#friends' }
			const addressBooksData = {
				public: new Map([
					[addressBookUri, { name: 'Public Book', groups: [], contacts: [] }]
				]),
				private: new Map()
			} as any

			const result = addGroupToAddressBookData(addressBooksData, addressBookUri, group)

			expect(result).toBe(true)
			expect(addressBooksData.public.get(addressBookUri).groups).toHaveLength(1)
			expect(addressBooksData.public.get(addressBookUri).groups[0]).toEqual(group)
		})

		it('does not add duplicate group URIs to a private address book', () => {
			const addressBookUri = 'https://pod.example/private-address-book/#this'
			const group = { name: 'Team', uri: 'https://pod.example/private-address-book/groups#team' }
			const addressBooksData = {
				public: new Map(),
				private: new Map([
					[addressBookUri, { name: 'Private Book', groups: [group], contacts: [] }]
				])
			} as any

			const result = addGroupToAddressBookData(addressBooksData, addressBookUri, group)

			expect(result).toBe(true)
			expect(addressBooksData.private.get(addressBookUri).groups).toHaveLength(1)
		})

		it('returns false when address book URI is not found', () => {
			const addressBooksData = {
				public: new Map(),
				private: new Map()
			} as any

			const result = addGroupToAddressBookData(addressBooksData, 'https://pod.example/missing#this', {
				name: 'Any',
				uri: 'https://pod.example/missing#group'
			})

			expect(result).toBe(false)
		})
	})

	describe('updateAddressBookName', () => {
		it('exists', () => {
			expect(updateAddressBookName).toBeInstanceOf(Function)
		})

		it('updates title and fn statements with trimmed name', async () => {
			const fetcherLoad = jest.fn().mockResolvedValue(undefined)
			const statementsMatching = jest.fn().mockReturnValue([{ id: 'old' }])
			const updaterUpdate = jest.fn().mockResolvedValue(undefined)
			const context = {
				session: {
					store: {
						fetcher: { load: fetcherLoad },
						statementsMatching,
						updater: { update: updaterUpdate }
					}
				}
			} as any

			await updateAddressBookName(context, 'https://pod.example/address-book/index.ttl#this', '  My Address Book  ')

			expect(fetcherLoad).toHaveBeenCalledTimes(1)
			expect(statementsMatching).toHaveBeenCalledTimes(2)
			expect(updaterUpdate).toHaveBeenCalledTimes(1)
			const [deletions, insertions] = updaterUpdate.mock.calls[0]
			expect(deletions).toHaveLength(2)
			expect(insertions).toHaveLength(2)
		})

		it('does nothing when new name is empty after trim', async () => {
			const fetcherLoad = jest.fn()
			const updaterUpdate = jest.fn()
			const context = {
				session: {
					store: {
						fetcher: { load: fetcherLoad },
						statementsMatching: jest.fn(),
						updater: { update: updaterUpdate }
					}
				}
			} as any

			await updateAddressBookName(context, 'https://pod.example/address-book/index.ttl#this', '    ')

			expect(fetcherLoad).not.toHaveBeenCalled()
			expect(updaterUpdate).not.toHaveBeenCalled()
		})

		it('reports errors when updater fails', async () => {
			const context = {
				session: {
					store: {
						fetcher: { load: jest.fn().mockResolvedValue(undefined) },
						statementsMatching: jest.fn().mockReturnValue([]),
						updater: { update: jest.fn().mockRejectedValue(new Error('update failed')) }
					}
				}
			} as any

			await updateAddressBookName(context, 'https://pod.example/address-book/index.ttl#this', 'Book')

			expect(addErrorToErrorDisplay).toHaveBeenCalled()
		})
	})

	describe('addWebIDToExistingContact', () => {
		it('exists', () => {
			expect(addWebIDToExistingContact).toBeInstanceOf(Function)
		})

		it('loads contact and adds webID triple', async () => {
			const fetcherLoad = jest.fn().mockResolvedValue(undefined)
			const updaterUpdate = jest.fn().mockResolvedValue(undefined)
			const context = {
				session: {
					store: {
						fetcher: { load: fetcherLoad },
						updater: { update: updaterUpdate },
						bnode: jest.fn(() => namedNode('https://pod.example/contacts#webid-node')),
						each: jest.fn().mockReturnValue([]),
						statementsMatching: jest.fn().mockReturnValue([])
					}
				}
			} as any

			await addWebIDToExistingContact(context, { webID: 'https://alice.example/profile#me' } as any, 'https://pod.example/contacts#alice')

			expect(fetcherLoad).toHaveBeenCalledWith('https://pod.example/contacts#alice')
			expect(addWebIDToContacts).not.toHaveBeenCalled()
			expect(updaterUpdate).toHaveBeenCalledTimes(1)
			const [, insertions] = updaterUpdate.mock.calls[0]
			expect(insertions.map((statement) => statement.predicate.value)).toEqual([
				'http://www.w3.org/2006/vcard/ns#url',
				'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
				'http://www.w3.org/2006/vcard/ns#value'
			])
		})

		it('reports errors when loading contact fails', async () => {
			const context = {
				session: {
					store: {
						fetcher: { load: jest.fn().mockRejectedValue(new Error('load failed')) }
					}
				}
			} as any

			await addWebIDToExistingContact(context, { webID: 'https://alice.example/profile#me' } as any, 'https://pod.example/contacts#alice')

			expect(addErrorToErrorDisplay).toHaveBeenCalled()
		})
	})
})
