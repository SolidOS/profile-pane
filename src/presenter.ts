import { IndexedFormula, NamedNode } from "rdflib";
import { ns, utils } from "solid-ui";
import { findImage } from "solid-ui/lib/widgets/buttons";
import Node from "rdflib/src/node-internal";

export interface ProfilePresentation {
  name: string;
  imageSrc?: string;
  introduction?: string;
  location?: string;
  backgroundColor: string;
  highlightColor: string;
}

export const presentProfile = (
  subject: NamedNode,
  store: IndexedFormula
): ProfilePresentation => {
  const name = utils.label(subject);
  const imageSrc = findImage(subject);
  const role = store.anyValue(subject, ns.vcard("role"));
  const orgName = store.anyValue(subject, ns.vcard("organization-name"));

  const address: Node | null = store.any(subject, ns.vcard("hasAddress"));
  const countryName =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard("country-name"))
      : null;
  const locality =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard("locality"))
      : null;

  const { backgroundColor, highlightColor } = getColors(subject, store);

  return {
    name,
    imageSrc,
    introduction: formatIntroduction(role, orgName),
    location: formatLocation(countryName, locality),
    backgroundColor,
    highlightColor,
  };
};

function formatLocation(countryName: string | void, locality: string | void) {
  return countryName && locality
    ? `${locality}, ${countryName}`
    : countryName || locality || null;
}

function formatIntroduction(role: string | void, orgName: string | void) {
  return role && orgName ? `${role} at ${orgName}` : orgName || role || null;
}

function getColors(subject: NamedNode, store: IndexedFormula) {
  const backgroundColor =
    store.anyValue(
      subject,
      ns.solid("profileBackgroundColor"),
      null,
      subject.doc()
    ) || "#eee";

  const highlightColor =
    store.anyValue(
      subject,
      ns.solid("profileHighlightColor"),
      null,
      subject.doc()
    ) || "#090";
  return { backgroundColor, highlightColor };
}
