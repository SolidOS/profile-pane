// Preserved for later reuse when the dedicated edit-profile pane entrypoint returns.
// These skipped tests still capture the older editor-pane contract and can be adapted
// once edit-profile rendering is wired back into the current surface.

import { beforeAll, describe, expect, it } from '@jest/globals'
import pane from '../src/index'
import { parse } from 'rdflib'
import { store } from 'solid-logic'
import { context, doc, subject, fakeLogInAs } from './setup'

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const exampleProfile = `
             @prefix : <https://janedoe.example/profile/card#> .
    @prefix Ber: <https://www.w3.org/People/Berners-Lee/> .
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .
    @prefix prof: <https://solidos.github.io/profile-pane/src/ontology/socialMedia.ttl#> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

    :id1729675527480     a prof:BlueSkyAccount;
         foaf:accountName "timbl.bsky.social" .

    :id1729912807298     a prof:FacebookAccount;
         foaf:accountName "tim.bernerslee.9" .

    :id1729912986863     a prof:InstagramAccount;
         foaf:accountName "timblee" .

    :id1730055928507     a prof:MastodonAccount;
         foaf:accountName "@timbl@w3c.social" .

    :id1730056067040     a prof:RedditAccount .

    :id1730056125033     a prof:RedditAccount;
         foaf:accountName "timbl" .

    :id1730056175230     a prof:TwitterAccount;
         foaf:accountName "@timberners_lee" .

    :id1730056248989     a prof:OtherAccount;
         rdfs:label "My homepage at W3C";
         foaf:homepage Ber:;
         foaf:icon <https://www.w3.org/assets/logos/w3c/w3c-bars.svg> .

    :id1730058497607     a prof:SnapchatAccount .

    :id1730059685809     a prof:TiktokAccount .

    :id1730387315524     a prof:GithubAccount;
         foaf:accountName "timbl" .

    :id1730387353050     a prof:MatrixAccount;
         foaf:accountName " @timbl-54d26c98db8155e6700f7312:gitter.im" .

    :me     foaf:account  (
        :id1729675527480
        :id1729912807298
        :id1729912986863
        :id1730055928507
        :id1730056067040
        :id1730056100390
        :id1730056125033
        :id1730056175230
        :id1730056248989
        :id1730058497607
        :id1730059685809 ) .
`

const editorPane = (pane as typeof pane & {
  editor?: { render: (subject: unknown, context: unknown) => HTMLElement }
}).editor

describe.skip('edit-profile-pane', () => {
  let element: HTMLElement

  describe('edit social media (logged in)', () => {
    beforeAll(async () => {
      if (!editorPane) return

      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      fakeLogInAs(subject)
      store.updater.editable = function () { return 'SPARQL' }
      const result = editorPane.render(subject, context)
      await delay(3000)

      element = result
    })

    it('renders the social networks', () => {
      expect(element.innerHTML).toContain('Edit your profile')
    })
  })

  describe('edit social media (Not logged in)', () => {
    beforeAll(async () => {
      if (!editorPane) return

      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      fakeLogInAs(null)
      store.updater.editable = function () { return 'SPARQL' }
      const result = editorPane.render(subject, context)
      await delay(3000)
      element = result
    })

    it('gives you a log in button', () => {
      expect(element.innerHTML).toContain('Log in')
    })
  })
})