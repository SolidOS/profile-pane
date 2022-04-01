import { DataBrowserContext } from "pane-registry";
import { NamedNode, LiveStore } from "rdflib";
import { render } from "lit-html";
import { ProfileView } from "./ProfileView";
import { icons, ns } from "solid-ui";
import { toCanvas } from 'qrcode'

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
  render: (subject: NamedNode, context: DataBrowserContext): HTMLElement => {
    const target = context.dom.createElement("div");
    const store = context.session.store;

    loadExtendedProfile(store, subject).then(() => {
      render(ProfileView(subject, context), target)

      const QRCodeEles = Array.from(context.dom.getElementsByClassName('QRCode'))
      if (!QRCodeEles.length) return console.error("QRCode Ele missing")
      for (const canvas of QRCodeEles) {
        const value = canvas.getAttribute('data-value')
        if (!value) return console.error("QRCode data-value missing")
        const highlightColor = canvas.getAttribute('highlightColor') || '#000000'
        const backgroundColor = canvas.getAttribute('backgroundColor') || '#ffffff'
        const options = {
          color: {
            dark: highlightColor,
            light: backgroundColor
          }
        }
        // see https://www.npmjs.com/package/qrcode#tocanvascanvaselement-text-options-cberror
        toCanvas(canvas, value, options, function (error) {
          if (error) {
            console.error('QRcode error!', error)
          } else {
            console.log('QRcode success.');
          }
        });
      }
    })

    return target;
  },
};
export default Pane;
