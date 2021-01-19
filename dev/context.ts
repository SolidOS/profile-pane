import {DataBrowserContext, LiveStore, PaneRegistry} from "pane-registry";
import { store } from "solid-ui";

export const context: DataBrowserContext = {
  session: {
    store: store as LiveStore,
    paneRegistry: null as PaneRegistry,
  },
  dom: document,
  getOutliner: () => null,
};

export const fetcher = store.fetcher;
