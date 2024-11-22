// A card in my profile to show yu a QRCode of my webid
//
import { html, TemplateResult } from "lit-html";
import { NamedNode } from 'rdflib'
import {
  fullWidth,
  heading,
  paddingSmall,
  textCenter,
  textLeft,
  textGray,
} from "./baseStyles";
import { ProfilePresentation } from "./presenter";
import { styleMap } from "lit-html/directives/style-map.js";
import { utils } from "solid-ui";

const styles = {
  image: styleMap(fullWidth()),
  intro: styleMap({ ...textGray(), ...textCenter() }),
  card: styleMap({}),
  info: styleMap({ ...paddingSmall(), ...textLeft() }),
};

export const QRCodeCard = (
  profileBasics: ProfilePresentation,
  subject: NamedNode
): TemplateResult => {
  const nameStyle = styleMap({
    ...heading(),
    // "text-decoration": "underline",
    color: profileBasics.highlightColor, // was "text-decoration-color"
  });
  const qrCodeCanvasStyle = 'width: 80%; margin:auto;'
  const highlightColor = profileBasics.highlightColor || '#000000'
  const backgroundColor = profileBasics.backgroundColor || '#ffffff'
  // console.log(`@@ qrcodes colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)

  const name = utils.label(subject);

  const BEGIN:string = 'BEGIN:VCARD\r\n';
  const END:string = 'END:VCARD\r\n';
  const FN:string = 'FN:' + name + '\r\n';
  const URL:string = 'URL:' + subject.uri + 'r\n';
  const VERSIONV:string = 'VERSION:4.0\r\n';

// find out how to import values from presenter.ts
// once those values are imported, make sure any user input aligns


  const vCard: string = BEGIN + FN + URL + END + VERSIONV;


  // console.log(`@@ qrcodes colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)
   
  return html`
  <div>
    <div style=${styles.card}>
      <h3 style=${nameStyle}>${profileBasics.name}</h3>
      <div class="QRCode" style="${qrCodeCanvasStyle}" data-value="${vCard}" highlightColor="${highlightColor}" backgroundColor="${backgroundColor}"></div>
    </div>
  </div>
  `;
};
