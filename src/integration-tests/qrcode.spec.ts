import pane from "../index";
import { parse } from "rdflib";
import { store } from "solid-logic";
import { findByTestId } from "@testing-library/dom";
import { context, delay, doc, subject } from "./setup";

// This was at testingsolidos.solidcommunity.net
const exampleProfile = `@prefix : <#>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix ldp: <http://www.w3.org/ns/ldp#>.
@prefix schema: <http://schema.org/>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix space: <http://www.w3.org/ns/pim/space#>.
@prefix vcard: <http://www.w3.org/2006/vcard/ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix pro: <./>.
@prefix inbox: </inbox/>.
@prefix tes: </>.
@prefix l: <https://www.w3.org/ns/iana/language-code/>.
@prefix org: <http://www.w3.org/ns/org#>.
@prefix ent: <http://www.wikidata.org/entity/>.
@prefix not: <https://notthereal.apple.com/>.
@prefix www: <https://www.thebeatles.com/>.
@prefix ww: <https://www.nasa.gov/>.
@prefix occup: <http://data.europa.eu/esco/occupation/>.
@prefix c: <https://solidos.solidcommunity.net/profile/card#>.
@prefix n0: <http://www.w3.org/ns/auth/acl#>.
@prefix skill: <http://data.europa.eu/esco/skill/>.

occup:50af07f0-7a75-424e-a66d-5a9deea10f4c
    schema:name
    "testeur d\u2019accessibilit\u00e9/testeuse d\u2019accessibilit\u00e9".
occup:6b0ad7c0-a37f-45c6-a486-ee943a11429e schema:name "astrologue".

occup:807a1ac3-4f56-41f3-a68c-d653d558eb0a schema:name "copilote".

occup:88990bdf-4f6b-4411-82c9-9eecad1db8fb
schema:name "professeur de musique/professeure de musique".
skill:aec4c9bf-9c44-4f9d-99f1-70011cebe1a8
schema:name "tester du mat\u00e9riel d\u2019instrumentation".
skill:b805f989-14d5-46ad-80b0-755634b66dba
schema:name "travailler dans de mauvaises conditions m\u00e9t\u00e9orologiques".
ent:Q23548 schema:name "NASA"@yo.

ent:Q312 schema:name "Apple"@fr.

pro:card a foaf:PersonalProfileDocument; foaf:maker :me; foaf:primaryTopic :me.

:id1621179872094 solid:publicId l:fr.

:id1621182189397 solid:publicId l:de.

:id1621184812427
    a solid:FutureRole;
    schema:description "Second future role";
    schema:startDate "2023-12-25"^^xsd:date;
    vcard:role "Mission a Mars";
    org:member :me;
    org:organization :id1621184844320;
    org:role occup:6b0ad7c0-a37f-45c6-a486-ee943a11429e.

:id1621182208190
    a solid:CurrentRole;
    schema:startDate "2021-04-01"^^xsd:date;
    # schema:endDate "2022-04-01"^^xsd:date;

    vcard:role "Testeuse des Apps Solid";
    org:member :me;
    org:organization :id1621182234226;
    org:role occup:50af07f0-7a75-424e-a66d-5a9deea10f4c.
:id1621182234226
    a schema:Corporation;
    schema:name "Apple";
    schema:uri not:;
    solid:publicId ent:Q312.

:id1621182452881
    a solid:PastRole;
    schema:description "This was an imaginary but fun gig.";
    schema:endDate "1963-04-01"^^xsd:date;
    schema:startDate "1960-04-01"^^xsd:date;
    vcard:role "Directed the white album";
    org:member :me;
    org:organization :id1621182460879;
    org:role occup:88990bdf-4f6b-4411-82c9-9eecad1db8fb.
:id1621182460879 a schema:MusicGroup; schema:name "The Beatles"; schema:uri www:.

:id1621183757035
    a solid:FutureRole;
    schema:description "Imaginary future roles are sometimes the best";
    schema:endDate "1993-04-01"^^xsd:date;
    schema:startDate "1990-05-01"^^xsd:date;
    vcard:role "Dream: Fly a couple of missions";
    org:member :me;
    org:organization :id1621183860447;
    org:role occup:807a1ac3-4f56-41f3-a68c-d653d558eb0a.




:id1621183860447
    a schema:GovernmentOrganization;
    schema:name "National Aeronautical and Space Administration";
    schema:uri ww:;
    solid:publicId ent:Q23548.


:id1621184844320
    a schema:GovernmentOrganization;
    schema:name "NASA";
    schema:uri ww:;
    solid:publicId ent:Q23548.
:id1622021411833
    vcard:country-name "USA";
    vcard:locality "Testingville";
    vcard:region "Texas";
    vcard:street-address "The testing tree house".
:id1622021761923 solid:publicId skill:aec4c9bf-9c44-4f9d-99f1-70011cebe1a8 .

:id1622021775187 solid:publicId skill:b805f989-14d5-46ad-80b0-755634b66dba.

:skill2 vcard:role  "sitting and chatting" .


:me
    a schema:Person, foaf:Person;
    schema:knowsLanguage ( :id1621179872094 :id1621182189397 );
    schema:skills :id1622021761923, :id1622021775187, :skill2, :NonExistentSkill;
    vcard:bday "2021-05-14"^^xsd:date;
    vcard:fn "Testing SolidOS Test";
    vcard:hasAddress :id1622021411833;
    vcard:hasPhoto <noun_test_2974484.svg>;
    vcard:note
        "This is a test account for testing versions of the SolidOS operating system for solid.";
    vcard:organization-name "Solid";
    vcard:role "foobar";
    n0:trustedApp
            [
                n0:mode n0:Append, n0:Control, n0:Read, n0:Write;
                n0:origin <https://timbl.com>
            ];
    ldp:inbox inbox:;
    space:preferencesFile </settings/prefs.ttl>;
    space:storage tes:;
    solid:account tes:;
    solid:preferredObjectPronoun "them";
    solid:preferredRelativePronoun "foobar";
    solid:preferredSubjectPronoun "they";
    solid:privateTypeIndex </settings/privateTypeIndex.ttl>;
    solid:profileBackgroundColor "#f4f5c2"^^xsd:color;
    solid:profileHighlightColor "#06b74a"^^xsd:color;
    solid:publicTypeIndex </settings/publicTypeIndex.ttl>;
    foaf:knows c:me;
    foaf:name "Testing SolidOS";
    foaf:nick "tester1".
l:de schema:name "germano"@ia.

l:fr schema:name "French"@en.

`
describe("profile-pane", () => {
  let element;

  describe("qrcode", () => {
    beforeAll(async () => {
      store.removeDocument(doc);
      parse(exampleProfile, store, doc.uri);
      const result = pane.render(subject, context);
      console.log('qrcode result:', result)
      await delay(3000)
      console.log('qrcode result later:', result)

      element = await findByTestId(result, "qrcode-display");
      console.log('element: ', element)
      // console.log('element.outerHTML: ', element.outerHTML)


    });

    it("renders the name as a heading", () => {
      expect(element.innerHTML).toContain('Testing SolidOS Test</h3>')
    });

    it("renders the QRCode element", () => {
      expect(element.innerHTML).toContain('<svg')
      expect(element.innerHTML).toContain('FN:Testing SolidOS Test')
    });

    it("renders the right QRCode colors", () => {
      // const ele = element.children[0].children[1].children[0]
      expect(element.innerHTML).toContain('stroke="#06b74a"')
      expect(element.innerHTML).toContain('fill="#f4f5c2"')
    });


  });

});
