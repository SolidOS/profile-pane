import { sym } from "rdflib";
import { store } from "solid-ui";
import { DataBrowserContext } from "pane-registry";

export const subject = sym("https://janedoe.example/profile/card#me");
export const doc = subject.doc();

export const context = {
  dom: document,
  session: {
    store,
  },
} as DataBrowserContext;
