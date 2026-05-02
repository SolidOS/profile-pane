import { DataBrowserContext } from 'pane-registry'
import './styles/utilities.css'
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
    applyEnvironmentAttributes(target, context)

    const renderWithData = async () => {
      applyEnvironmentAttributes(target, context)
      render(await ProfileView(subject, context, renderWithData), target)
      await hydrateQRCodes(target)
    }

    loadExtendedProfile(store, subject).then(async () => {
      await renderWithData()
    })

    return target
  },
}

export default Pane
