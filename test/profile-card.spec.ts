import pane from '../src/index'
import { parse } from 'rdflib'
import {
  findByAltText,
  findByTestId,
  getByAltText,
  queryByAltText,
  waitFor,
} from '@testing-library/dom'
import { context, doc, subject } from './setup'
import fetchMock from 'jest-fetch-mock'
import { store } from 'solid-logic'

describe('profile-pane', () => { // alain
  let result: HTMLElement

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
      result = pane.render(subject, context)
      document.body.appendChild(result)
    })

    it('renders the name in header', () => {
      const header = result.querySelector('header.header')
      expect(header?.innerHTML).toMatch(/Jane Doe/i)
    })
    it('renders the introduction', () => {
      const intro = result.querySelector('section.intro')
      expect(intro?.innerHTML).toMatch(/Test Double at Solid Community/i)
    })
    it('renders the location', () => {
      const intro = result.querySelector('section.intro')
      expect(intro?.innerHTML).toMatch(/🌐/i)
      expect(intro?.innerHTML).toMatch(/Hamburg, Germany/i)
    })
    it('renders the preferred Pronouns', () => {
      const intro = result.querySelector('section.intro')
      expect(intro?.innerHTML).toMatch(/their\/they\/them/i)
    })
    it('renders the image', () => {
      const image = result.querySelector('img.image')
      expect(image).not.toBeNull()
      expect(image).toHaveAttribute('src', 'https://janedoe.example/profile/me.jpg')
      expect(image).toHaveAttribute('alt', expect.stringContaining('Jane Doe'))
    })
    it('contains semantic article and aside', () => {
      expect(result.querySelector('article.profileCard')).not.toBeNull()
      expect(result.querySelector('aside.qrCodeSection')).not.toBeNull()
    })
  })

  describe.skip('with empty profile', () => { // alain
    let card: HTMLElement
    beforeAll(async () => {
      result = pane.render(subject, context)
      document.body.appendChild(result)
      card = await findByTestId(result, 'profile-card')
    })

    it('renders only a makeshift name based on URI', () => {
      expect(card.textContent.trim()).toContain('Jane Doe')
    })

    it('does not render broken profile image', () => {
      const image = queryByAltText(card, /.*/)
      expect(image).toBeNull()
    })
  })

  describe('with extended profile', () => {
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
      result = pane.render(subject, context)
      document.body.appendChild(result)
    })

    it('renders the name in header', () => {
      const header = result.querySelector('header.header')
      expect(header?.innerHTML).toMatch(/Jane Doe/i)
    })
    it('renders the introduction', () => {
      const details = Array.from(result.querySelectorAll('section.intro .details'));
      const intro = details.find(d => /Test Double at Solid Community/i.test(d.textContent));
      expect(intro).not.toBeNull();
    })
    it('renders the location', () => {
      const details = Array.from(result.querySelectorAll('section.intro .details'));
      const location = details.find(d => /🌐/.test(d.textContent) && /Hamburg, Germany/i.test(d.textContent));
      expect(location).not.toBeNull();
    })
    it('renders the image', () => {
      const image = result.querySelector('img');
      expect(image).not.toBeNull();
      expect(image).toHaveAttribute('src', 'https://janedoe.example/profile/me.jpg');
      expect(image).toHaveAttribute('alt', expect.stringContaining('Jane Doe'));
    })
  })
})
