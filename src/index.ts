import { DataBrowserContext } from 'pane-registry'
import './styles/CVCard.css'
import './styles/ChatWithMe.css'
import './styles/FriendList.css'
import './styles/ProfileCard.css'
import './styles/ProfileView.css'
import './styles/QRCodeCard.css'
import './styles/SocialCard.css'
import './styles/utilities.css'
import { NamedNode, LiveStore } from 'rdflib'
import { render } from 'lit-html'
import { ProfileView } from './ProfileView'
import { icons, ns } from 'solid-ui'
import * as qrcode from 'qrcode'
export {
  addMeToYourFriendsDiv,
  createAddMeToYourFriendsButton,
  saveNewThing,
  checkIfThingExists
} from './addMeToYourFriends'

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
  render: (subject: NamedNode, context: DataBrowserContext): HTMLElement => {
    const target = context.dom.createElement('div')
    const store = context.session.store

    const renderWithData = async () => {
      render(await ProfileView(subject, context, renderWithData), target)
      const QRCodeEles = Array.from(target.getElementsByClassName('qrcode-card'))
      if (!QRCodeEles.length) return console.error('QRCode Ele missing')
      for (const QRCodeElement of QRCodeEles as HTMLElement[]) {
        const value = QRCodeElement.getAttribute('data-value')
        if (!value) return console.error('QRCode data-value missing')

        const options = {
          type: 'svg',
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        }

        qrcode.toString(value, options, function (error, svg) {
          if (error) {
            console.error('QRcode error!', error)
          } else {
            const imageContainer = QRCodeElement.querySelector('div[role="img"]') as HTMLElement | null
            if (!imageContainer) {
              console.error('QRCode image container missing')
              return
            }
            imageContainer.innerHTML = svg
            imageContainer.style.width = '100%'
            imageContainer.style.height = '100%'
            imageContainer.style.margin = '0'
          }
        })
      }
    }

    loadExtendedProfile(store, subject).then(async () => {
      await renderWithData()
    })

    return target
  },
}

export default Pane
