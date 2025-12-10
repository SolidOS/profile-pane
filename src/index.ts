import { DataBrowserContext } from 'pane-registry'
import { NamedNode, LiveStore } from 'rdflib'
import './ProfileView'
import editProfileView from './editProfilePane/editProfile.view'
import { icons, ns } from 'solid-ui'

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
  editor: editProfileView,                                            
  render: (subject: NamedNode, context: DataBrowserContext): HTMLElement => {
    const target: HTMLElement = context.dom.createElement('div')
    const store = context.session.store

    loadExtendedProfile(store, subject).then(() => {
      // Create the custom element
      const profileViewEl = document.createElement('profile-view') as HTMLElement & { subject?: NamedNode, context?: DataBrowserContext }
      profileViewEl.subject = subject
      profileViewEl.context = context
      target.appendChild(profileViewEl)
    })

    return target
  },
}

export default Pane
