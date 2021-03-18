import { sym } from "rdflib";
import { store, solidLogicSingleton } from "solid-ui";
import { DataBrowserContext } from "pane-registry";

export const subject = sym("https://janedoe.example/profile/card#me");
export const doc = subject.doc();

export const context = {
  dom: document,
  getOutliner: () => null,
  session: {
    paneRegistry: null,
    store,
    logic: solidLogicSingleton
  },
} as DataBrowserContext;
