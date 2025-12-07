import pane from '../src/index'
import { parse } from 'rdflib'
import {
  findByTestId,
  queryByAltText,
} from '@testing-library/dom'
import { context, doc, subject } from './setup'
import fetchMock from 'jest-fetch-mock'
import { store } from 'solid-logic'

describe('profile-pane', () => { // alain
  let container: HTMLElement
  let shadow: ShadowRoot

  describe('with full profile', () => {
    beforeAll(async () => {
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      @prefix solid: <http://www.w3.org/ns/solid/terms#>.
      :me foaf:name "Jane Doe";
          foaf:img <https://janedoe.example/profile/me.jpg>;
          vcard:role "Test Double";
          vcard:organization-name "Solid Community";
          solid:preferredObjectPronoun "they";
          solid:preferredRelativePronoun "them";
          solid:preferredSubjectPronoun "their";
          vcard:hasAddress [
            vcard:locality "Hamburg";
            vcard:country-name "Germany";
          ];
      .
  `
      parse(turtle, store, doc.uri)
      container = pane.render(subject, context)
      document.body.appendChild(container)
      // Wait for profile-view to be defined and present
      await customElements.whenDefined('profile-view')
      let profileView: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        profileView = container.querySelector('profile-view') as HTMLElement | null
        if (profileView) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileView).not.toBeNull()
      // Wait for profile-card to be defined and present in shadowRoot
      await customElements.whenDefined('profile-card')
      let profileCard: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        const profileShadow = profileView!.shadowRoot
        if (profileShadow) {
          profileCard = profileShadow.querySelector('profile-card') as HTMLElement | null
          if (profileCard) break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileCard).not.toBeNull()
      // Use profileCard.shadowRoot for all queries below
      shadow = profileCard!.shadowRoot!
    })

    it('renders the name in header', () => {
      const header = shadow.querySelector('header.header')
      expect(header).not.toBeNull()
      expect(header!.innerHTML).toMatch(/Jane Doe/i)
    })
    it('renders the introduction', () => {
      const intro = shadow.querySelector('section.intro')
      expect(intro).not.toBeNull()
      expect(intro!.innerHTML).toMatch(/Test Double at Solid Community/i)
    })
    it('renders the location', () => {
      const intro = shadow.querySelector('section.intro')
      expect(intro).not.toBeNull()
      expect(intro!.innerHTML).toMatch(/🌐/i)
      expect(intro!.innerHTML).toMatch(/Hamburg, Germany/i)
    })
    it('renders the preferred Pronouns', () => {
      const intro = shadow.querySelector('section.intro')
      expect(intro).not.toBeNull()
      expect(intro!.innerHTML).toMatch(/their\/they\/them/i)
    })
    it('renders the image', () => {
      const image = shadow.querySelector('img.image')
      expect(image).not.toBeNull()
      expect(image).toHaveAttribute('src', 'https://janedoe.example/profile/me.jpg')
      expect(image).toHaveAttribute('alt', expect.stringContaining('Jane Doe'))
    })
    it('contains semantic article and aside', () => {
      expect(shadow.querySelector('article.profileCard')).not.toBeNull()
      expect(shadow.querySelector('aside.qrCodeSection')).not.toBeNull()
    })
  })

  describe('with empty profile', () => {
    let container: HTMLElement
    let shadow: ShadowRoot
    let profileCard: HTMLElement | null
    let card: HTMLElement
    beforeAll(async () => {
      container = pane.render(subject, context)
      document.body.appendChild(container)
      await customElements.whenDefined('profile-view')
      let profileView: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        profileView = container.querySelector('profile-view') as HTMLElement | null
        if (profileView) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileView).not.toBeNull()
      await customElements.whenDefined('profile-card')
      profileCard = null
      for (let i = 0; i < 20; i++) {
        const profileShadow = profileView!.shadowRoot
        if (profileShadow) {
          profileCard = profileShadow.querySelector('profile-card') as HTMLElement | null
          if (profileCard) break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileCard).not.toBeNull()
      shadow = profileCard!.shadowRoot!
      // Use profileCard directly for assertions
      card = profileCard!
    })

    it('renders only a makeshift name based on URI', () => {
      expect(card.textContent!.trim()).toMatch('')
    })

    it('does not render broken profile image', () => {
      const image = queryByAltText(profileCard!, /.*/)
      expect(image).toBeNull()
    })
  })

  describe('with extended profile', () => {
    let container: HTMLElement
    let shadow: ShadowRoot
    beforeAll(async () => {
      const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
      :me foaf:name "Jane Doe";
          rdfs:seeAlso <./more.ttl>, <./address.ttl>;
      .`
      parse(turtle, store, doc.uri)
      fetchMock.mockOnceIf(
        'https://janedoe.example/profile/more.ttl',
        `
              @prefix jane: </profile/card#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      jane:me foaf:img <https://janedoe.example/profile/me.jpg>;
          vcard:role "Test Double";
          vcard:organization-name "Solid Community";
      .
      `,
        {
          headers: {
            'Content-Type': 'text/turtle',
          },
        }
      )
      fetchMock.mockOnceIf(
        'https://janedoe.example/profile/address.ttl',
        `
              @prefix jane: </profile/card#>.
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      jane:me vcard:hasAddress [
            vcard:locality "Hamburg";
            vcard:country-name "Germany";
          ];
      .
      `,
        {
          headers: {
            'Content-Type': 'text/turtle',
          },
        }
      )
      container = pane.render(subject, context)
      document.body.appendChild(container)
      // Wait for profile-view to be defined and present
      await customElements.whenDefined('profile-view')
      let profileView: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        profileView = container.querySelector('profile-view') as HTMLElement | null
        if (profileView) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileView).not.toBeNull()
      // Wait for profile-card to be defined and present in shadowRoot
      await customElements.whenDefined('profile-card')
      let profileCard: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        const profileShadow = profileView!.shadowRoot
        if (profileShadow) {
          profileCard = profileShadow.querySelector('profile-card') as HTMLElement | null
          if (profileCard) break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileCard).not.toBeNull()
      // Use profileCard.shadowRoot for all queries below
      shadow = profileCard!.shadowRoot!
    })

    it('renders the name in header', () => {
      const header = shadow.querySelector('header.header')
      expect(header).not.toBeNull()
      expect(header!.innerHTML).toMatch(/Jane Doe/i)
    })
    it('renders the introduction', () => {
      const details = Array.from(shadow.querySelectorAll('section.intro .details'))
      const intro = details.find((d: Element) => /Test Double at Solid Community/i.test(d.textContent || ''))
      expect(intro).not.toBeNull()
    })
    it('renders the location', () => {
      const details = Array.from(shadow.querySelectorAll('section.intro .details'))
      const location = details.find((d: Element) => /🌐/.test(d.textContent || '') && /Hamburg, Germany/i.test(d.textContent || ''))
      expect(location).not.toBeNull()
    })
    it('renders the image', () => {
      const image = shadow.querySelector('img')
      expect(image).not.toBeNull()
      expect(image).toHaveAttribute('src', 'https://janedoe.example/profile/me.jpg')
      expect(image).toHaveAttribute('alt', expect.stringContaining('Jane Doe'))
    })
  })
})
