import { IndexedFormula, NamedNode } from "rdflib";
import { ns, utils, language } from "solid-ui";
import { findImage } from "solid-ui/lib/widgets/buttons";
import Node from "rdflib/src/node-internal";
import { validateHTMLColorHex } from "validate-color";

export interface ProfilePresentation {
  name: string;
  imageSrc?: string;
  introduction?: string;
  languages?: string;
  location?: string;
  pronouns?: string;
  backgroundColor: string;
  highlightColor: string;
}

export const presentProfile = (
  subject: NamedNode,
  store: IndexedFormula
): ProfilePresentation => {
  const profile = subject.doc()
  const name = utils.label(subject);
  const imageSrc = findImage(subject);
  const role = store.anyValue(subject, ns.vcard("role"))
  const orgName = store.anyValue(subject, ns.vcard("organization-name"), null, profile);

  const address: Node | null = store.any(subject, ns.vcard("hasAddress"), null, profile);
  const countryName =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard("country-name"), null, profile)
      : null;
  const locality =
    address != null
      ? store.anyValue(address as NamedNode, ns.vcard("locality"), null, profile)
      : null;

  const { backgroundColor, highlightColor } = getColors(subject, store);

  let pronouns = store.anyJS(subject, ns.solid('preferredSubjectPronoun'), null, profile) || ''
  if (pronouns) {
    const them = store.anyJS(subject, ns.solid('preferredObjectPronoun'), null, profile)
    if (them) {
      pronouns += '/' + them
      const their = store.anyJS(subject, ns.solid('preferredRelativePronoun'), null, profile)
      if (their) {
        pronouns += '/' + their
      }
    }
    pronouns = ' (' + pronouns + ') '
  }
  return {
    name,
    imageSrc,
    introduction: formatIntroduction(role, orgName),
    location: formatLocation(countryName, locality),
    backgroundColor,
    pronouns,
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
  const backgroundColor = store.anyValue(
    subject,
    ns.solid("profileBackgroundColor"),
    null,
    subject.doc()
  );

  const highlightColor = store.anyValue(
    subject,
    ns.solid("profileHighlightColor"),
    null,
    subject.doc()
  );
  return {
    backgroundColor: validColorOrDefault(backgroundColor, "#eee"),
    highlightColor: validColorOrDefault(highlightColor, "#090"),
  };
}

function validColorOrDefault(color: string | void, fallback: string) {
  return color && validateHTMLColorHex(color) ? color : fallback;
}
