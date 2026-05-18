import { describe, expect, it, beforeEach } from '@jest/globals'
import pane from '../src/index'
import { parse } from 'rdflib'
import { waitFor } from '@testing-library/dom'
import { context, doc, subject } from './setup'
import { store } from 'solid-logic'

describe('profile pane heading integration', () => {
  beforeEach(() => {
    store.removeDocument(doc)
  })

  it('renders the current heading contract for a populated profile', async () => {
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
          ].
    `

    parse(turtle, store, doc.uri)
    const result = pane.render(subject, context)

    await waitFor(() => {
      expect(result.querySelector('#profile-name')?.textContent).toBe('Jane Doe')
      expect(result.textContent).toContain('Test Double')
      expect(result.textContent).toContain('Hamburg')
      expect(result.textContent).toContain('Germany')
    })

    const image = result.querySelector('img.profile__hero') as HTMLImageElement | null
    expect(image?.getAttribute('src')).toBe('https://janedoe.example/profile/me.jpg')
  })
})
