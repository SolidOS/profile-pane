import pane from '../src/index'
import { parse } from 'rdflib'
import { context, doc, subject } from './setup'
import fetchMock from 'jest-fetch-mock'
import { store } from 'solid-logic'

describe('profile-pane', () => {
  let friends: HTMLElement | null

  describe('with friends', () => {
    beforeAll(async () => {
      // Enable debug logging for presentFriends and FriendListElement
      (window as any).__DEBUG_FRIENDS = true
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:knows :alice, :bob .
      :alice foaf:name "Alice" .
      :bob vcard:fn "Bob" .
      `
      parse(turtle, store, doc.uri)
      const result = pane.render(subject, context);
      document.body.appendChild(result)
      // Wait for <profile-view> to be attached
      let profileViewEl = null
      for (let i = 0; i < 40; i++) {
        profileViewEl = result.querySelector('profile-view')
        if (profileViewEl) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileViewEl).not.toBeNull()

      // Wait for friend-list to be attached
      let friendListEl = null
      for (let i = 0; i < 40; i++) {
        friendListEl = profileViewEl.shadowRoot && profileViewEl.shadowRoot.querySelector('friend-list')
        if (friendListEl) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(friendListEl).not.toBeNull()
      // Wait for friendListSection to be attached
      friends = null
      for (let i = 0; i < 40; i++) {
        friends = friendListEl.shadowRoot && friendListEl.shadowRoot.querySelector('section.friendListSection[data-testid="friend-list"]')
        if (friends) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    })

    it('renders Alice in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Alice/i)
      }
    })
    it('renders Bob in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Bob/i)
      }
    })
    it('contains semantic section and table', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.querySelector('table.profileTable')).not.toBeNull()
        const rows = friends.querySelectorAll('tbody tr')
        expect(rows.length).toBeGreaterThan(0)
      }
    })
  })

  describe('without friends', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      const result = pane.render(subject, context)
      document.body.appendChild(result)
      await new Promise(resolve => setTimeout(resolve, 100))
      const friendListEl = result.querySelector('friend-list')
      friends = friendListEl && friendListEl.shadowRoot
        ? friendListEl.shadowRoot.querySelector('section.friendListSection[data-testid="friend-list"]')
        : null
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
      :me foaf:knows :alice, :bob .
      :alice foaf:name "Alice" .
      :bob vcard:fn "Bob" .
      :me rdfs:seeAlso <./friends.ttl>;
      .
  `
      parse(turtle, store, doc.uri)
      fetchMock.mockOnceIf(
        'https://janedoe.example/profile/friends.ttl',
        `
          @prefix jane: </profile/card#>.
          @prefix foaf: <http://xmlns.com/foaf/0.1/> .
          @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
          jane:me foaf:knows :claire, :dave .
          :claire foaf:name "Claire" .
          :dave vcard:fn "Dave" .
      `,
        {
          headers: {
            'Content-Type': 'text/turtle',
          },
        }
      )
      const result = pane.render(subject, context)
      document.body.appendChild(result)
      // Debug: print shadow DOM of <profile-view>
      let profileViewEl = null
      for (let i = 0; i < 40; i++) {
        profileViewEl = result.querySelector('profile-view')
        if (profileViewEl) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      let friendListEl = null
      for (let i = 0; i < 40; i++) {
        friendListEl = profileViewEl && profileViewEl.shadowRoot && profileViewEl.shadowRoot.querySelector('friend-list')
        if (friendListEl) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      friends = friendListEl && friendListEl.shadowRoot
        ? friendListEl.shadowRoot.querySelector('section.friendListSection[data-testid="friend-list"]')
        : null
    })

    it('renders Alice in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Alice/i)
      }
    })
    it('renders Bob in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Bob/i)
      }
    })
    it('renders Claire in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Claire/i)
      }
    })
    it('renders Dave in list', () => {
      expect(friends).not.toBeNull()
      if (friends) {
        expect(friends.innerHTML).toMatch(/Dave/i)
      }
    })
  })
})
