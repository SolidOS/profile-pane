import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { render } from 'lit-html'
import { ProfileView } from './ProfileView'
import { icons, ns } from 'solid-ui'
import { hydrateQRCodes } from './sections/qrcode/QRCodeCard'
import { createResizeDrivenSync } from './utils/resize'
import { Layout } from './types'
import { presentProfile } from './selectors'
export { presentProfile } from './selectors'
export { getViewerMode } from './viewerMode'
export type { ProfileDetails, ViewerMode } from './types'
export type { AddressDetails, ContactAddressRow, ContactPointRow, PointDetails } from './sections/contactInfo/types'

const PROFILE_HEADING_SAVED_EVENT = 'profile-heading-saved'
const MOBILE_LAYOUT_MAX_WIDTH = 768
const HEADING_SECTION_SELECTOR = '[data-profile-section="heading"]'
const SOCIAL_SECTION_SELECTOR = '[data-profile-section="social"]'

async function loadExtendedProfile(store: LiveStore, subject: NamedNode) {
  const otherProfiles = store.each(
    subject,
    ns.rdfs('seeAlso'),
    null,
    subject.doc()
  ) as Array<NamedNode>
  if (otherProfiles.length > 0) {
    await store.fetcher.load(otherProfiles)
  }
}

function measureLayout(context: DataBrowserContext, root?: HTMLElement | null): Layout {
  if (context.environment?.layout === 'mobile') {
    return 'mobile'
  }

  if (typeof window === 'undefined') {
    return 'desktop'
  }

  const measuredWidth = root?.getBoundingClientRect().width || window.innerWidth
  return measuredWidth <= MOBILE_LAYOUT_MAX_WIDTH ? 'mobile' : 'desktop'
}

function syncRenderedLayout(
  root: HTMLElement,
  context: DataBrowserContext,
  onLayoutChange: (layout: Layout) => void
): () => void {
  const updateLayout = () => {
    const nextLayout = measureLayout(context, root)
    if (nextLayout !== root.dataset.layout) {
      onLayoutChange(nextLayout)
    }
  }

  const grid = root.querySelector('.profile-grid') as HTMLElement | null
  return createResizeDrivenSync(updateLayout, [root, grid])
}

function syncSocialSectionHeight(root: HTMLElement): () => void {
  const updateHeight = () => {
    const grid = root.querySelector('.profile-grid') as HTMLElement | null
    const headingSection = root.querySelector(HEADING_SECTION_SELECTOR) as HTMLElement | null
    const socialSection = root.querySelector(SOCIAL_SECTION_SELECTOR) as HTMLElement | null

    if (!grid || !headingSection || !socialSection) {
      return
    }

    const isDesktopGrid = root.dataset.layout !== 'mobile' && getComputedStyle(grid).display === 'grid'
    if (!isDesktopGrid) {
      socialSection.style.removeProperty('min-height')
      return
    }

    const nextMinHeight = `${Math.ceil(headingSection.getBoundingClientRect().height)}px`
    if (socialSection.style.minHeight !== nextMinHeight) {
      socialSection.style.minHeight = nextMinHeight
    }
  }
  const headingSection = root.querySelector(HEADING_SECTION_SELECTOR) as HTMLElement | null
  const socialSection = root.querySelector(SOCIAL_SECTION_SELECTOR) as HTMLElement | null

  return createResizeDrivenSync(updateHeight, [root, headingSection, socialSection])
}

function applyEnvironmentAttributes(
  element: HTMLElement,
  context: DataBrowserContext
): void {
  const layout = context.environment?.layout ?? 'desktop'
  const theme = context.environment?.theme ?? 'light'
  const inputMode = context.environment?.inputMode ?? 'pointer'

  element.classList.add('profile-pane-host')
  element.dataset.layout = layout
  element.dataset.theme = theme
  element.dataset.inputMode = inputMode
}

const Pane = {
  global: false,
  icon: icons.iconBase + 'noun_15059.svg',
  name: 'profile',
  label: function (
    subject: NamedNode,
    context: DataBrowserContext
  ): string | null {
    const t = context.session.store.findTypeURIs(subject)
    if (
      t[ns.vcard('Individual').uri] ||
      t[ns.foaf('Person').uri] ||
      t[ns.schema('Person').uri]
    ) {
      return 'Profile'
    }
    return null
  },                                         
  render: (subject: NamedNode, context: DataBrowserContext): HTMLElement => {
    const target = context.dom.createElement('div')
    const store = context.session.store
    let cleanupSocialSectionHeightSync: (() => void) | null = null
    let cleanupLayoutSync: (() => void) | null = null
    let currentLayout: Layout = measureLayout(context, target)

    applyEnvironmentAttributes(target, context)
    target.dataset.layout = currentLayout

    let disposed = false

    const renderWithData = async () => {
      if (disposed) return
      applyEnvironmentAttributes(target, context)
      target.dataset.layout = currentLayout
      const view = await ProfileView(subject, context, currentLayout, async () => {
        if (disposed) return
        target.dispatchEvent(new CustomEvent('profile-pane-saved', {
          bubbles: true,
          composed: true,
          detail: {
            subjectUri: subject.value,
            profileData: presentProfile(subject, store)
          }
        }))
        await renderWithData()
      })
      if (disposed) return
      render(view, target)
      cleanupSocialSectionHeightSync?.()
      cleanupSocialSectionHeightSync = syncSocialSectionHeight(target)
      cleanupLayoutSync?.()
      cleanupLayoutSync = syncRenderedLayout(target, context, (nextLayout) => {
        currentLayout = nextLayout
        void renderWithData()
      })
      await hydrateQRCodes(target)
    }

    // Hosts may edit this profile elsewhere (e.g. a standalone heading); rerender so
    // sections such as More contacts reflect the updated store.
    let wasConnected = target.isConnected
    const dispose = () => {
      if (disposed) return
      disposed = true
      context.dom.removeEventListener(PROFILE_HEADING_SAVED_EVENT, handleHeadingSaved)
      connectionObserver.disconnect()
      cleanupSocialSectionHeightSync?.()
      cleanupLayoutSync?.()
    }
    const connectionObserver = new MutationObserver((records) => {
      // Added-node records also cover mounting and removal within one mutation batch.
      wasConnected ||= target.isConnected || records.some(record =>
        Array.from(record.addedNodes).some(node => node === target || node.contains(target))
      )
      if (wasConnected && !target.isConnected) dispose()
    })
    connectionObserver.observe(context.dom, { childList: true, subtree: true })
    const handleHeadingSaved = (event: Event) => {
      if (target.isConnected) {
        wasConnected = true
      } else if (wasConnected) {
        dispose()
        return
      } else {
        return
      }

      const detail = (event as CustomEvent<{ subjectUri?: string }>).detail
      if (detail?.subjectUri !== subject.value) return
      renderWithData().catch((error: unknown) => {
        console.error('Failed to refresh the profile after a heading update.', error)
      })
    }
    context.dom.addEventListener(PROFILE_HEADING_SAVED_EVENT, handleHeadingSaved)

    loadExtendedProfile(store, subject).then(async () => {
      await renderWithData()
    })

    return target
  },
}

export default Pane
