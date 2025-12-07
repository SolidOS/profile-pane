import pane from '../src/index'
import { parse } from 'rdflib'
import { store } from 'solid-logic'
import { context, doc } from './setup'
import { NamedNode } from 'rdflib'


// import exampleProfile from './examples/testingsolidos.ttl'


// This was at testingsolidos.solidcommunity.net

const exampleProfile = `#Processed by Id
        #    using base file:///Users/timbl_1/src/github.com/solidos/solidos/workspaces/profile-pane/src/integration-tests/examples/tim-social.ttl
             @prefix : <#> .
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

describe('profile-pane', () => {
  let element: HTMLElement | null = null

  describe('social media', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      parse(exampleProfile, store, 'https://example.org/profile')
      const meUri = 'https://example.org/profile#me'
      const subject = new NamedNode(meUri)
      const result = pane.render(subject, context)
      document.body.appendChild(result)
      // Poll for <profile-view>
      let profileView: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        profileView = result.querySelector('profile-view') as HTMLElement | null
        if (profileView) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(profileView).not.toBeNull()
      // Poll for <social-card> inside <profile-view>'s shadow DOM
      let socialCard: HTMLElement | null = null
      for (let i = 0; i < 20; i++) {
        if (profileView!.shadowRoot) {
          socialCard = profileView!.shadowRoot.querySelector('social-card') as HTMLElement | null
        }
        if (socialCard) break
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      expect(socialCard).not.toBeNull()
      // Wait for shadow DOM to render
      await new Promise(resolve => setTimeout(resolve, 50))
      const shadow = socialCard!.shadowRoot
      expect(shadow).not.toBeNull()
      element = shadow!.querySelector('section.socialCard[data-testid="social-media"]') as HTMLElement | null
    })

    it('renders the social networks section', () => {
      expect(element).not.toBeNull()
      expect(element!.querySelector('h3#social-card-title')).not.toBeNull()
      expect(element!.querySelector('ul.socialList')).not.toBeNull()
    })

    it('renders link to Facebook', () => {
      const facebook = Array.from(element!.querySelectorAll('span')).find(span => (span as HTMLElement).textContent?.includes('Facebook'))
      expect(facebook).not.toBeNull()
    })
  })

})
