import pane from '../src/index'
import { parse } from 'rdflib'
import { store } from 'solid-logic'
import { context, doc, subject } from './setup'


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
  let element

  describe('social media', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      const result = pane.render(subject, context)
      document.body.appendChild(result)
      // SocialCardElement uses Shadow DOM, so query the custom element and its shadow
      const socialCard = result.querySelector('social-card')
      expect(socialCard).not.toBeNull()
      // Wait for shadow DOM to render
      await new Promise(resolve => setTimeout(resolve, 50))
      element = socialCard.shadowRoot.querySelector('section.socialCard[data-testid="social-media"]')
    })

    it('renders the social networks section', () => {
      expect(element).not.toBeNull()
      expect(element.querySelector('h3#social-card-title')).not.toBeNull()
      expect(element.querySelector('ul.socialList')).not.toBeNull()
    })

    it('renders link to Facebook', () => {
      const facebook = Array.from(element.querySelectorAll('span')).find(span => span.textContent?.includes('Facebook'))
      expect(facebook).not.toBeNull()
    })

    /*
    it("renders organization Apple in list", () => {
      expect(element).toContainHTML("Apple");
    });
    it("renders lone start date in list", () => {
      expect(element).toContainHTML("(2021-04-01 to");
    });
    it("renders start and end dates in role", () => {
      expect(element).toContainHTML("(1960-04-01 to 1963-04-01)");
    });
    it("renders skill 1 in CV", () => {
      expect(element).toContainHTML("Tester Du Matériel D’instrumentation");
    });
    it("renders skill 2 in CV", () => {
      expect(element).toContainHTML("Travailler Dans De Mauvaises Conditions");
    });
    it("renders skill 3 vcard role in CV", () => {
      expect(element).toContainHTML("Sitting");
    });
    it("renders error flag when missing skill text CV", () => {
      expect(element).toContainHTML("¿¿¿ Skill ???");
    });
    it("renders languages", () => {
      expect(element).toContainHTML("French");
    });

    it("renders languages", () => {
      expect(element).toContainHTML("Germano");
    });
    */
  })

})
