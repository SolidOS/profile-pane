// A card in my profile to show yu a QRCode of my webid
//
import { toCanvas } from 'qrcode'
import { html, TemplateResult, render } from "lit-html";
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
// import { QRCodePresentation } from "./QRCodePresenter";
import { styleMap } from "lit-html/directives/style-map.js";

const dom = document // @@ get from context.dom

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

  // See https://reactjs.org/docs/refs-and-the-dom.html
  const result:TemplateResult = html`
    <div style=${styles.info}>
      <h3 style=${nameStyle}>QR Code</h3> // @@ put name here?
      <canvas class="QRCode" data-value="${subject.uri}"></canvas>
    </div>
  `;
  // const ele = result.getTemplateElement()
  // console.log('result: ', result) // @@@
  // for (const x in result) console.log('    result ', x, ' -> ', result[x])

  //const ele2 = ele.firstChild
  //console.log('ele2 ' + ele2.innerHTML)
  // ele2.appendChild(renderQRCode(subject.uri))
  return result
};

function renderQRCode(string) {
  const canvas = dom.createElement('canvas')
  toCanvas(canvas, string, function (error) {
    if (error) {
      console.error('QRcode error!', error)
    } else {
      console.log('QRcode success.');
    }
  });
  return canvas
}
