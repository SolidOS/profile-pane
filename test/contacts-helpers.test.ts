jest.mock('contacts-pane', () => ({
	__esModule: true,
	default: {
		mintNew: jest.fn()
	},
	addWebIDToContacts: jest.fn()
}))

jest.mock('../src/contactsErrors', () => ({
	addErrorToErrorDisplay: jest.fn()
}))

import {
	addWebIDToExistingContact,
	addGroupToAddressBookData,
	checkIfContactExistsByName,
	checkIfContactExistsByWebID,
	updateAddressBookName
} from '../src/contactsHelpers'
import { addWebIDToContacts } from 'contacts-pane'
import { addErrorToErrorDisplay } from '../src/contactsErrors'

describe('contactsHelpers', () => {
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
			const context = {
				session: {
					store: {
						fetcher: { load: fetcherLoad }
					}
				}
			} as any

			await addWebIDToExistingContact(context, { webID: 'https://alice.example/profile#me' } as any, 'https://pod.example/contacts#alice')

			expect(fetcherLoad).toHaveBeenCalledWith('https://pod.example/contacts#alice')
			expect(addWebIDToContacts).toHaveBeenCalledTimes(1)
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
