import { presentProfile } from "./presenter";
import { blankNode, sym } from "rdflib";
import { ns, store } from "solid-ui";

describe("presenter", () => {
  const jane = sym("https://jane.doe.example/profile/card#me");
  const doc = jane.doc();

  beforeEach(() => {
    store.removeDocument(doc);
  });

  it("presents minimum available info", () => {
    const result = presentProfile(jane, store);
    expect(result.name).toBe("jane.doe.example");
    expect(result.imageSrc).toBeNull();
    expect(result.introduction).toBeNull();
    expect(result.location).toBeNull();
  });

  it("presents a name", () => {
    store.add(jane, ns.foaf("name"), "Jane Doe", doc);
    const result = presentProfile(jane, store);
    expect(result.name).toBe("Jane Doe");
  });

  it("presents an image", () => {
    store.add(
      jane,
      ns.foaf("img"),
      sym("https://jane.doe.example/profile/me.jpg"),
      doc
    );
    const result = presentProfile(jane, store);
    expect(result.imageSrc).toBe("https://jane.doe.example/profile/me.jpg");
  });

  it("presents role in introduction", () => {
    store.add(jane, ns.vcard("role"), "Test Double", doc);
    const result = presentProfile(jane, store);
    expect(result.introduction).toBe("Test Double");
  });

  it("presents organization name in introduction", () => {
    store.add(jane, ns.vcard("organization-name"), "Solid Community", doc);
    const result = presentProfile(jane, store);
    expect(result.introduction).toBe("Solid Community");
  });

  it("presents both role and organization name in introduction", () => {
    store.add(jane, ns.vcard("role"), "Test Double", doc);
    store.add(jane, ns.vcard("organization-name"), "Solid Community", doc);
    const result = presentProfile(jane, store);
    expect(result.introduction).toBe("Test Double at Solid Community");
  });

  it("presents country in location", () => {
    const address = blankNode();
    store.add(jane, ns.vcard("hasAddress"), address, doc);
    store.add(address, ns.vcard("country-name"), "Germany", doc);
    const result = presentProfile(jane, store);
    expect(result.location).toBe("Germany");
  });

  it("presents locality in location", () => {
    const address = blankNode();
    store.add(jane, ns.vcard("hasAddress"), address, doc);
    store.add(address, ns.vcard("locality"), "Hamburg", doc);
    const result = presentProfile(jane, store);
    expect(result.location).toBe("Hamburg");
  });

  it("presents both locality and country name in location", () => {
    const address = blankNode();
    store.add(jane, ns.vcard("hasAddress"), address, doc);
    store.add(address, ns.vcard("locality"), "Hamburg", doc);
    store.add(address, ns.vcard("country-name"), "Germany", doc);
    const result = presentProfile(jane, store);
    expect(result.location).toBe("Hamburg, Germany");
  });

  it("presents preferred Pronouns", () => {
    store.add(jane, ns.solid("preferredSubjectPronoun"), "they", doc);
    store.add(jane, ns.solid("preferredObjectPronoun"), "them", doc);
    store.add(jane, ns.solid("preferredRelativePronoun"), "their", doc);
    const result = presentProfile(jane, store);
    expect(result.pronouns).toBe(" (they/them/their) ");
  });
  
  describe("coloring", () => {
    it("presents default colors", () => {
      const result = presentProfile(jane, store);
      expect(result.backgroundColor).toBe("#eee");
      expect(result.highlightColor).toBe("#090");
    });
    it("uses background color from profile settings", () => {
      store.add(jane, ns.solid("profileBackgroundColor"), "#123456", doc);
      const { backgroundColor } = presentProfile(jane, store);
      expect(backgroundColor).toBe("#123456");
    });
    it("uses highlight color from profile settings", () => {
      store.add(jane, ns.solid("profileHighlightColor"), "#987654", doc);
      const { highlightColor } = presentProfile(jane, store);
      expect(highlightColor).toBe("#987654");
    });
    it("presents default colors if settings are messed up", () => {
      store.add(jane, ns.solid("profileBackgroundColor"), "foobar", doc);
      store.add(jane, ns.solid("profileHighlightColor"), "42", doc);
      const result = presentProfile(jane, store);
      expect(result.backgroundColor).toBe("#eee");
      expect(result.highlightColor).toBe("#090");
    });
  });
});
