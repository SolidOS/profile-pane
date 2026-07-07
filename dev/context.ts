import { longChatPane } from 'chat-pane'
//import * as contact from 'contacts-pane' //uncomment for profileEditor
import {
  DataBrowserContext,
  InputMode,
  LayoutMode,
  LayoutPreference,
  PaneRegistry,
  RenderEnvironment,
  ThemeMode,
} from 'pane-registry'
import { solidLogicSingleton, store } from 'solid-logic'
import { LiveStore } from 'rdflib'

// Configure fetcher for development
if (store.fetcher) {
  // Configure for cross-origin requests
  (store.fetcher as any).crossSite = true;
  (store.fetcher as any).withCredentials = false;
}

const MOBILE_BREAKPOINT = 768

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

function getInputMode(): InputMode {
  return window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'pointer'
}

function resolveLayout(
  layoutPreference: LayoutPreference,
  viewport = getViewport()
): LayoutMode {
  if (layoutPreference === 'auto') {
    return viewport.width <= MOBILE_BREAKPOINT ? 'mobile' : 'desktop'
  }

  return layoutPreference
}

function getInitialTheme(): ThemeMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const environment: RenderEnvironment = {
  layoutPreference: 'auto',
  viewport: getViewport(),
  inputMode: getInputMode(),
  theme: getInitialTheme(),
  layout: 'desktop',
}

environment.layout = resolveLayout(environment.layoutPreference, environment.viewport)

export function updateEnvironment(
  patch: Partial<Pick<RenderEnvironment, 'layoutPreference' | 'theme' | 'inputMode' | 'viewport'>> = {}
): RenderEnvironment {
  if (patch.layoutPreference) {
    environment.layoutPreference = patch.layoutPreference
  }

  if (patch.theme) {
    environment.theme = patch.theme
  }

  if (patch.inputMode) {
    environment.inputMode = patch.inputMode
  }

  if (patch.viewport) {
    environment.viewport = patch.viewport
  }

  environment.layout = resolveLayout(
    environment.layoutPreference,
    environment.viewport
  )

  return environment
}

export function syncEnvironmentToWindow(): RenderEnvironment {
  return updateEnvironment({
    viewport: getViewport(),
  })
}

export const context: DataBrowserContext = {
  session: {
    store: store as LiveStore,
    paneRegistry: {
      byName: (name: string) => {
        return longChatPane
        //return contact //uncomment for profile editor
      }
    } as PaneRegistry,
    logic: solidLogicSingleton
  },
  dom: document,
  getOutliner: () => null,
  environment,
}

export const fetcher = store.fetcher
