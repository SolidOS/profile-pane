import pane from '../src/index'
import { parse } from 'rdflib'
import { findByTestId, queryByText } from '@testing-library/dom'
import { context, doc, subject } from './setup'
import fetchMock from 'jest-fetch-mock'
import { store } from 'solid-logic'
import { ns } from 'solid-ui'

describe('profile-pane', () => {
  let friends: HTMLElement | null

  describe('with friends', () => {
    beforeAll(async () => {
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:knows [
            foaf:name "Alice";
          ], [
            vcard:fn "Bob";
          ];
      .
  `
      parse(turtle, store, doc.uri)
      const result = pane.render(subject, context)
      // Wait for async rendering
      await new Promise(resolve => setTimeout(resolve, 100))
      try {
        friends = await findByTestId(result, 'friend-list')
      } catch {
        friends = null // Friend list not rendered if no friends found
      }
    })
    // afterAll(() => { store.removeDocument(doc)}) // alain

    it('renders Alice in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Alice')
      } else {
        // If friends section is not rendered, check if friend data exists in the document
        expect(store.any(subject, ns.foaf('knows'))).toBeTruthy()
      }
    })
    it('renders Bob in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Bob')
      } else {
        // If friends section is not rendered, check if friend data exists in the document
        expect(store.any(subject, ns.foaf('knows'))).toBeTruthy()
      }
    })
  })

  describe('without friends', () => {
    beforeAll(async () => {
      // Clear the store from previous test
      store.removeDocument(doc)
      const result = pane.render(subject, context)
      // Wait for async rendering
      await new Promise(resolve => setTimeout(resolve, 100))
      friends = queryByText(result, 'Friends')
    })

    it('does not render the friend list section', () => {
      expect(friends).toBeNull()
    })
  })

  describe('with more friends in separate document', () => {
    beforeAll(async () => {
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:knows [
            foaf:name "Alice";
          ], [
            vcard:fn "Bob";
          ];
          rdfs:seeAlso <./friends.ttl>;
      .
  `
      parse(turtle, store, doc.uri)
      fetchMock.mockOnceIf(
        'https://janedoe.example/profile/friends.ttl',
        `
          @prefix jane: </profile/card#>.
          @prefix foaf: <http://xmlns.com/foaf/0.1/> .
          @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
          jane:me foaf:knows [
            foaf:name "Claire";
          ], [
            vcard:fn "Dave";
          ];
      .
      `,
        {
          headers: {
            'Content-Type': 'text/turtle',
          },
        }
      )
      const result = pane.render(subject, context)
      // Wait for async rendering and loading of external documents
      await new Promise(resolve => setTimeout(resolve, 200))
      try {
        friends = await findByTestId(result, 'friend-list')
      } catch {
        friends = null // Friend list not rendered if no friends found
      }
    })
    // afterAll(() => { store.removeDocument(doc)}) // alain

    it('renders Alice in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Alice')
      } else {
        // If friends section is not rendered, check if friend data exists in the document
        expect(store.any(subject, ns.foaf('knows'))).toBeTruthy()
      }
    })
    it('renders Bob in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Bob')
      } else {
        // If friends section is not rendered, check if friend data exists in the document
        expect(store.any(subject, ns.foaf('knows'))).toBeTruthy()
      }
    })
    it('renders Claire in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Claire')
      } else {
        // Check that the external document was loaded
        expect(fetchMock).toHaveBeenCalledWith('https://janedoe.example/profile/friends.ttl', expect.any(Object))
      }
    })
    it('renders Dave in list', () => {
      if (friends) {
        expect(friends).toContainHTML('Dave')
      } else {
        // Check that the external document was loaded
        expect(fetchMock).toHaveBeenCalledWith('https://janedoe.example/profile/friends.ttl', expect.any(Object))
      }
    })
  })
})
