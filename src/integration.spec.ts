import pane from "./";
import { sym } from "rdflib";
import { DataBrowserContext } from "pane-registry";

describe("profile-pane", () => {
  it("renders a profile", () => {
    const subject = sym("https://janedoe.example/profile/card#me");
    const context = {
      dom: document,
    } as DataBrowserContext;
    const result = pane.render(subject, context);
    expect(result).toContainHTML("Jane Doe");
    expect(result).toContainHTML("Test Double at Solid Community");
    expect(result).toContainHTML("Hamburg, Germany");
    expect(result).toContainHTML("Friends");
  });
});
