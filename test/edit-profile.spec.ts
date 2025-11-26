import pane from '../src/index'
import { parse } from 'rdflib'
import { store, authn } from 'solid-logic'
// import { findByTestId } from "@testing-library/dom";
import { context, doc, subject, fakeLogInAs } from './setup'


// import exampleProfile from './examples/testingsolidos.ttl'


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

 // console.log('exampleProfile', exampleProfile)

 const editorPane = pane.editor
 const user = authn.currentUser()

describe('edit-profile-pane', () => {
  let element: HTMLElement

  describe('edit social media (logged in)', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      fakeLogInAs(subject)
      const result = editorPane.render(subject, context)
      document.body.appendChild(result)
      element = result
    })

    it('renders the public profile editor section', () => {
      // Check for main editor section and heading
      const { waitFor } = require('@testing-library/dom')
      function findEditorDiv(node: Element | null): HTMLDivElement | null {
        if (!node) return null;
        if (node instanceof HTMLDivElement && node.matches('div[data-testid="profile-editor"]')) return node;
        for (const child of Array.from(node.children)) {
          const found = findEditorDiv(child as Element);
          if (found) return found;
        }
        return null;
      }
      return waitFor(() => {
        const section = findEditorDiv(element);
        expect(section).not.toBeNull();
        if (section) {
          expect(section.innerHTML).toMatch(/Edit your public profile/i);
        }
      }, { timeout: 5000 });
    })

    it.skip('renders thank you', () => {
      expect(element.innerHTML).toMatch(/Thank you for filling your profile/i)
    })
  })

  describe('edit social media (not logged in)', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      fakeLogInAs(null)
      store.updater.editable = function () { console.log('nocked editable'); return 'SPARQL'}
      const result = editorPane.render(subject, context)
      document.body.appendChild(result)
      element = result
    })

    it('gives you a log in button', () => {
      expect(element.innerHTML).toMatch(/Log in/i)
    })
  })
})
