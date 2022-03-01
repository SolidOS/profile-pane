import { NamedNode, LiveStore } from "rdflib";
import { ns, utils, widgets } from "solid-ui";
import { store } from "solid-logic";
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

export function pronounsAsText (subject:NamedNode): string {
  let pronouns = store.anyJS(subject, ns.solid('preferredSubjectPronoun')) || '';
  if (pronouns) {
    const them = store.anyJS(subject, ns.solid('preferredObjectPronoun'));
    if (them) {
      pronouns += '/' + them
      const their = store.anyJS(subject, ns.solid('preferredRelativePronoun'));
      if (their) {
        pronouns += '/' + their;
      }
    }
    pronouns = ' (' + pronouns + ') ';
  }
  return pronouns || '';
}

export const presentProfile = (
  subject: NamedNode,
  store: LiveStore
): ProfilePresentation => {
  const name = utils.label(subject);
  const imageSrc = widgets.findImage(subject);
  const role = store.anyValue(subject, ns.vcard("role"))
  const orgName = store.anyValue(subject, ns.vcard("organization-name")); // @@ Search whole store

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
  const pronouns = pronounsAsText(subject)
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

function getColors(subject: NamedNode, store: LiveStore) {
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
