import { longChatPane } from 'chat-pane'
import { DataBrowserContext, PaneRegistry } from 'pane-registry'
import { solidLogicSingleton, store } from 'solid-logic'
import { LiveStore } from 'rdflib'

// Configure fetcher for development
if (store.fetcher) {
  // Configure for cross-origin requests
  (store.fetcher as any).crossSite = true;
  (store.fetcher as any).withCredentials = false;
}

export const context: DataBrowserContext = {
  session: {
    store: store as LiveStore,
    paneRegistry: {
      byName: (name: string) => {
        return longChatPane
      }
    } as PaneRegistry,
    logic: solidLogicSingleton
  },
  dom: document,
  getOutliner: () => null,
}

export const fetcher = store.fetcher
