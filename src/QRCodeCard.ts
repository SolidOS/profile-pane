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
  const highlightColor = '#7c4cfc'
  const backgroundColor = '#ffffff'
  // console.log(`@@ qrcodes colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)

  return html`
    <div style=${styles.info}>
      <h3 style=${nameStyle}>${profileBasics.name}</h3>
      <div class="QRCode" style="${qrCodeCanvasStyle}" data-value="${subject.uri}" highlightColor="${highlightColor}"} backgroundColor="${backgroundColor}"></div>
    </div>
  `;
};
