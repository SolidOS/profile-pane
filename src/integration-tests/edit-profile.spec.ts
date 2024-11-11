import pane from "../index";
import { parse } from "rdflib";
import { store, authn } from "solid-logic";
import { findByTestId } from "@testing-library/dom";
import { context, doc, subject } from "./setup";


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
    
`;

 // console.log('exampleProfile', exampleProfile)

 const editorPane = pane.editor
 const user = authn.currentUser()
 console.log('Logged in user: ', user)

describe("edit-profile-pane", () => {
  let element;

  describe("social media", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      parse(exampleProfile, store, doc.uri);
      const result = editorPane.render(subject, context);
      console.log('editorPane name ', editorPane.name )
      console.log('editorPane rendered <<< ', result.innerHTML , '>>>')
      element = await findByTestId(result, "profile-editor");
    });

    it("renders the social networks", () => {
      expect(element).toContainHTML("Social Networks");
    });

    it("renders link to Facebook", () => {
      expect(element).toContainHTML("Facebook");
    });

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
  });

});
