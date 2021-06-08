import { presentCV} from "./CVpresenter";
import { blankNode, sym } from "rdflib";
import { ns, store } from "solid-ui";

describe("CVPresenter", () => {
  const jane = sym("https://jane.doe.example/profile/card#me");
  const doc = jane.doc();

  beforeEach(() => {
    store.removeDocument(doc);
  });

  it.skip("presents minimum available info", () => {
    const result = presentCV(jane, store);
    expect(result.rolesByType).toBeNull();
    expect(result.skills).toBeNull();
  });

  it.skip("presents minimum available info", () => {
    const organization = blankNode();
    store.add(jane, ns.org("member"), organization, doc);
    store.add(organization, ns.schema("name"), "Inrupt", doc);
    const result = presentCV(jane, store);
    expect(result.rolesByType).toBe('Inrupt');
  });
});
