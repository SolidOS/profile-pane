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
  render: (subject: NamedNode, { dom }: DataBrowserContext): HTMLElement => {
    const target = dom.createElement("div");
    render(ProfileView(subject), target);
    return target;
  },
};
export default Pane;
