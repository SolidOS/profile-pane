import { presentCV} from "./CVpresenter";
import { blankNode, sym } from "rdflib";
import { ns, store } from "solid-ui";

describe("CVPresenter", () => {
  const jane = sym("https://jane.doe.example/profile/card#me");
  const doc = jane.doc();

  beforeEach(() => {
    store.removeDocument(doc);
  });

  it("presents minimum available info", () => {
    const result = presentCV(jane, store);
    expect(result.rolesByType).toBeNull();
    expect(result.skills).toBeNull();
  });

});
