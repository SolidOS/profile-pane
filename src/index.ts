import { DataBrowserContext } from "pane-registry";
import { NamedNode, LiveStore } from "rdflib";
import { render } from "lit-html";
import { ProfileView } from "./ProfileView";
import editProfileView from './editProfilePane/editProfile.view'
import { icons, ns } from "solid-ui";
import * as qrcode from 'qrcode'

async function loadExtendedProfile(store: LiveStore, subject: NamedNode) {
  const otherProfiles = store.each(
    subject,
    ns.rdfs("seeAlso"),
    null,
    subject.doc()
  ) as Array<NamedNode>;
  if (otherProfiles.length > 0) {
    await store.fetcher.load(otherProfiles);
  }
}

const Pane = {
  global: false,
  icon: icons.iconBase + "noun_15059.svg",
  name: "profile",
  label: function (
    subject: NamedNode,
    context: DataBrowserContext
  ): string | null {
    const t = context.session.store.findTypeURIs(subject);
    if (
      t[ns.vcard("Individual").uri] ||
      t[ns.foaf("Person").uri] ||
      t[ns.schema("Person").uri]
    ) {
      return "Profile";
    }
    return null;
  },
  editor: editProfileView,                                            
  render: (subject: NamedNode, context: DataBrowserContext): HTMLElement => {

    async function switchToEditor () {
      alert('switching to editor')
      target.innerHTML = '' // Clear
      const newPane = editProfileView.render(subject, context)
      const parent = target.parentNode
      parent.removeChild(target)
      parent.appendChild(newPane)
    }
    

    const target = context.dom.createElement("div");
    const store = context.session.store;

    loadExtendedProfile(store, subject).then(async () => {
      render(await ProfileView(subject, context), target)
/*  Not currently used as personTR does itself
      const fillIns =  Array.from(target.getElementsByClassName('fillInLater'))
      for (const ele of fillIns) {
        const href = ele.getAttribute('href')
        store.fetcher.load(href).then(()=> { // async
          const label = utils.label(store.sym(href))
          ele.children[1].textContent =  label // Relabel
          console.log('   ele.children[0]',   ele.children[1])
          console.log(` Relabelled  ${href} to "${label}"`)
        })
      }
      */
      const editButtons = Array.from(target.getElementsByClassName('ProfilePaneCVEditButton'))
      if (editButtons.length) {
        const editButton = editButtons[0]
        editButton.addEventListener('click', switchToEditor)
      } else {
        alert('No edit button')
      }

      const QRCodeEles = Array.from(target.getElementsByClassName('QRCode')) // was context.dom
      if (!QRCodeEles.length) return console.error("QRCode Ele missing")
      for (const QRCodeElement of QRCodeEles as HTMLElement[]) {
        const value = QRCodeElement.getAttribute('data-value')
        if (!value) return console.error("QRCode data-value missing")
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
            QRCodeElement.style.width = "80%"
            QRCodeElement.style.height = "80%"
            QRCodeElement.style.margin = "10%"
          }
        });

      }
    })

    return target;
  },
};

export default Pane;
