import {DataBrowserContext, LiveStore, PaneRegistry} from "pane-registry";
import { store, solidLogicSingleton } from "solid-ui";

export const context: DataBrowserContext = {
  session: {
    store: store as LiveStore,
    paneRegistry: {
      byName: (name: string) => {
        return {
          render: () => {
            return document.createElement('div')
                .appendChild(
                    document.createTextNode(`mock ${name} pane`)
                );
          }
        }
      }
    } as PaneRegistry,
    logic: solidLogicSingleton
  },
  dom: document,
  getOutliner: () => null,
};

export const fetcher = store.fetcher;
