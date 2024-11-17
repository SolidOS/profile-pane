import pane from "../index";
import { parse } from "rdflib";
import { store, authn } from "solid-logic";
// import { findByTestId } from "@testing-library/dom";
import { context, doc, subject, fakeLogInAs } from "./setup";


// import exampleProfile from './examples/testingsolidos.ttl'


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    
`;

 // console.log('exampleProfile', exampleProfile)

 const editorPane = pane.editor
 const user = authn.currentUser()
 console.log('Logged in user: ', user)

describe("edit-profile-pane", () => {
  let element;

  describe("edit social media (logged in)", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      parse(exampleProfile, store, doc.uri);
      fakeLogInAs(subject)
      store.updater.editable = function () { console.log('nocked editable'); return 'SPARQL'}
      const result = editorPane.render(subject, context);
      console.log('editorPane name ', editorPane.name )
      console.log('editorPane rendered 1 <<< ', result.innerHTML , '>>>')
      await delay(3000)
      console.log('editorPane rendered later 1 <<< ', result.outerHTML , '>>>')

      element = result;
    });

    it("renders the social networks", () => {
      expect(element).toContainHTML("Edit your public profile");
    });

    it("renders warning: public", () => {
      expect(element).toContainHTML("Everything you put here will be public");
    });

    it.skip("renders thank you", () => {
      expect(element).toContainHTML("Thank you for filling your profile");
    });
  });

  describe("edit social media (NOt logged in)", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      parse(exampleProfile, store, doc.uri);
      fakeLogInAs(null)
      store.updater.editable = function () { console.log('nocked editable'); return 'SPARQL'}
      const result = editorPane.render(subject, context);
      console.log('editorPane name ', editorPane.name )
      console.log('editorPane rendered early <<< ', result.outerHTML , '>>>')
      await delay(3000)
      console.log('editorPane rendered later <<< ', result.outerHTML , '>>>')
      element = result;
      // element = await findByTestId(result, "profile-editor");
    });

    it("gives you a log in button", () => {
      expect(element).toContainHTML("Log in");
    });
    
  });

  

});
