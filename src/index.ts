import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import { render } from 'lit-html'
import { ProfileView } from './ProfileView'
import { icons, ns } from 'solid-ui'
import { hydrateQRCodes } from './sections/qrcode/QRCodeCard'
export {
  addMeToYourFriendsDiv,
  createAddMeToYourFriendsButton,
  saveNewThing,
  checkIfThingExists
} from './specialButtons/addMeToYourFriends'

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

const HEADING_SECTION_SELECTOR = '[data-profile-section="heading"]'
const SOCIAL_SECTION_SELECTOR = '[data-profile-section="social"]'

function syncSocialSectionHeight(root: HTMLElement): () => void {
  let animationFrameId = 0

  const updateHeight = () => {
    animationFrameId = 0

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

  const scheduleUpdate = () => {
    if (animationFrameId !== 0) {
      return
    }

    animationFrameId = window.requestAnimationFrame(updateHeight)
  }

  updateHeight()

  if (typeof ResizeObserver === 'undefined') {
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId)
      }

      window.removeEventListener('resize', scheduleUpdate)
    }
  }

  const resizeObserver = new ResizeObserver(scheduleUpdate)
  resizeObserver.observe(root)

  const headingSection = root.querySelector(HEADING_SECTION_SELECTOR) as HTMLElement | null
  const socialSection = root.querySelector(SOCIAL_SECTION_SELECTOR) as HTMLElement | null

  if (headingSection) {
    resizeObserver.observe(headingSection)
  }

  if (socialSection) {
    resizeObserver.observe(socialSection)
  }

  return () => {
    if (animationFrameId !== 0) {
      window.cancelAnimationFrame(animationFrameId)
    }

    resizeObserver.disconnect()
  }
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

    applyEnvironmentAttributes(target, context)

    const renderWithData = async () => {
      applyEnvironmentAttributes(target, context)
      render(await ProfileView(subject, context, renderWithData), target)
      cleanupSocialSectionHeightSync?.()
      cleanupSocialSectionHeightSync = syncSocialSectionHeight(target)
      await hydrateQRCodes(target)
    }

    loadExtendedProfile(store, subject).then(async () => {
      await renderWithData()
    })

    return target
  },
}

export default Pane
