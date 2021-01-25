import { DataBrowserContext, LiveStore } from "pane-registry";
import { NamedNode } from "rdflib";
import { render } from "lit-html";
import { ProfileView } from "./ProfileView";
import { icons, ns } from "solid-ui";

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

    loadExtendedProfile(store, subject).then(() =>
      render(ProfileView(subject, context), target)
    );

    return target;
  },
};
export default Pane;
