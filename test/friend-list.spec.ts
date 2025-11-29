import pane from '../src/index'
import { parse } from 'rdflib'
import { findByTestId, queryByText } from '@testing-library/dom'
import { context, doc, subject } from './setup'
import fetchMock from 'jest-fetch-mock'
import { store } from 'solid-logic'

describe('profile-pane', () => {
  let friends

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
      friends = await findByTestId(result, 'friend-list')
    })
    // afterAll(() => { store.removeDocument(doc)}) // alain

    it('renders the friend list', () => {
      expect(friends).toContainHTML('Friends')
    })
    it('renders Alice in list', () => {
      expect(friends).toContainHTML('Alice')
    })
    it('renders Bob in list', () => {
      expect(friends).toContainHTML('Bob')
    })
  })

  describe('without friends', () => {
    beforeAll(async () => {
      const result = pane.render(subject, context)

      friends = await queryByText(result, 'Friends')
    })

    it('renders the friend list', () => {
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
      friends = await findByTestId(result, 'friend-list')
    })
    // afterAll(() => { store.removeDocument(doc)}) // alain

    it('renders the friend list', () => {
      expect(friends).toContainHTML('Friends')
    })

    it('renders Alice in list', () => {
      expect(friends).toContainHTML('Alice')
    })
    it('renders Bob in list', () => {
      expect(friends).toContainHTML('Bob')
    })
    it('renders Claire in list', () => {
      expect(friends).toContainHTML('Claire')
    })
    it('renders Dave in list', () => {
      expect(friends).toContainHTML('Dave')
    })
  })
})
