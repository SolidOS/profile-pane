import { DataBrowserContext } from 'pane-registry'
import './styles/CVCard.css'
import './styles/ChatWithMe.css'
import './styles/FriendList.css'
import './styles/ProfileCard.css'
import './styles/ProfileView.css'
import './styles/QRCodeCard.css'
import './styles/SocialCard.css'
import './styles/StuffCard.css'
import './styles/utilities.css'
import { NamedNode, LiveStore } from 'rdflib'
import { render } from 'lit-html'
import { ProfileView } from './ProfileView'
import editProfileView from './editProfilePane/editProfile.view'
import { icons, ns } from 'solid-ui'
import * as qrcode from 'qrcode'

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
    console.log('[Pane.render] Called for', subject.uri)
    const target = context.dom.createElement('div')
    const store = context.session.store

    loadExtendedProfile(store, subject).then(async () => {
      console.log('[Pane.render] Extended profile loaded, rendering ProfileView...')
      render(await ProfileView(subject, context), target)
      console.log('[Pane.render] ProfileView rendered')
      const QRCodeEles = Array.from(target.getElementsByClassName('QRCode')) // was context.dom
      if (!QRCodeEles.length) return console.error('QRCode Ele missing')
      for (const QRCodeElement of QRCodeEles as HTMLElement[]) {
        const value = QRCodeElement.getAttribute('data-value')
        if (!value) return console.error('QRCode data-value missing')
        const highlightColor = QRCodeElement.getAttribute('highlightColor') || '#000000'
        const backgroundColor = QRCodeElement.getAttribute('backgroundColor') || '#ffffff'
        // console.log(`@@ qrcodes2 colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)

        const options = {
          type: 'svg',
          color: {
            dark: highlightColor,
            light: backgroundColor
          }
        }

        qrcode.toString(value, options, function (error, svg) {
          if (error) {
            console.error('QRcode error!', error)
          } else {
            // console.log('QRcode success.', svg);
            QRCodeElement.innerHTML = svg
            QRCodeElement.style.width = '80%'
            QRCodeElement.style.height = '80%'
            QRCodeElement.style.margin = '10%'
          }
        })

      }
    })

    return target
  },
}

export default Pane
