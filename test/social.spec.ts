import pane from '../src/index'
import { parse } from 'rdflib'
import { store } from 'solid-logic'
import { findByTestId } from '@testing-library/dom'
import { context, doc, subject } from './setup'

const exampleProfile = `
    @prefix : <#> .
    @prefix Ber: <https://www.w3.org/People/Berners-Lee/> .
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .
    @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
    @prefix owl: <http://www.w3.org/2002/07/owl#>.
    
    :id1729675527480     a :BlueSkyAccount;
         foaf:accountName "timbl.bsky.social" .
    
    :id1729912807298     a :FacebookAccount;
         foaf:accountName "tim.bernerslee.9" .
    
    :id1729912986863     a :InstagramAccount;
         foaf:accountName "timblee" .
    
    :id1730055928507     a :MastodonAccount;
         foaf:accountName "@timbl@w3c.social" .
    
    :id1730056067040     a :RedditAccount .
    
    :id1730056125033     a :RedditAccount;
         foaf:accountName "timbl" .
    
    :id1730056175230     a :TwitterAccount;
         foaf:accountName "@timberners_lee" .
    
    :id1730056248989     a :OtherAccount;
         rdfs:label "My homepage at W3C";
         foaf:homepage Ber:;
         foaf:icon <https://www.w3.org/assets/logos/w3c/w3c-bars.svg> .
    
    :id1730058497607     a :SnapchatAccount .
    
    :id1730059685809     a :TiktokAccount .
    
    :id1730387315524     a :GithubAccount;
         foaf:accountName "timbl" .
    
    :id1730387353050     a :MatrixAccount;
         foaf:accountName " @timbl-54d26c98db8155e6700f7312:gitter.im" .
    
    :me     foaf:Account  (
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

    foaf:account a rdfs:Class;
      rdfs:label "Online Account Provider";
      owl:disjointUnionOf ( 
          :BlueSkyAccount :DiggAccount :FacebookAccount :GithubAccount :InstagramAccount
          :LinkedInAccount :MastodonAccount :MatrixAccount :MediumAccount :NostrAccount 
          :OrcidAccount :PinterestAccount :RedditAccount :SnapchatAccount :StravaAccount 
          :TiktokAccount  :TumblrAccount  :TwitterAccount :OtherAccount) .
          
    :FacebookAccount rdfs:subClassOf foaf:account ;
      rdfs:label "Facebook";
      foaf:userProfilePrefix "https://www.facebook.com/";
      foaf:icon <https://solidos.github.io/solid-ui/src/icons/social/facebook-2020-2-1.svg>;
      foaf:homepage <https://www.facebook.com/> .
`

 // console.log('exampleProfile', exampleProfile)

describe('profile-pane', () => {
  let element

  describe('social media', () => {
    beforeAll(async () => {
      store.removeDocument(doc)
      parse(exampleProfile, store, doc.uri)
      const result = pane.render(subject, context)
      console.log('Pane rendered <<< ', result.innerHTML , '>>>')
      // Wait for async rendering to complete
      element = await findByTestId(result, 'social-media', {}, { timeout: 5000 })
    })

    it('renders link to Facebook', () => {
      expect(element).toContainHTML('Facebook')
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
