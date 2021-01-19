import { DataBrowserContext } from "pane-registry";
import { NamedNode } from "rdflib";
import { render } from "lit-html";
import { ProfileView } from "./ProfileView";
import { icons, ns } from "solid-ui";

const Pane = {
  global: false,
  icon: icons.iconBase + "noun_15059.svg",
  name: "profile",
  label: function (subject, context) {
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
    render(ProfileView(subject, context), target);
    return target;
  },
};
export default Pane;
