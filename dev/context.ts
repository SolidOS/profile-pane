import { longChatPane } from 'chat-pane'
import { DataBrowserContext, PaneRegistry } from 'pane-registry'
import { LiveStore, solidLogicSingleton, store } from 'solid-logic'

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
