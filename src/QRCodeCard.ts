import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { utils } from 'solid-ui'
import './styles/QRCodeCard.css'
import { scanQrToConnectText } from './texts'


export const QRCodeCard = (
  highlightColor: string, 
  backgroundColor: string,
  subject: NamedNode
): TemplateResult => {
  const hC = highlightColor || '#000000'
  const bC = backgroundColor || '#ffffff'
  const name = utils.label(subject)

  const BEGIN = 'BEGIN:VCARD\r\n'
  const END = 'END:VCARD\r\n'
  const FN = 'FN:' + name + '\r\n'
  const URL = 'URL:' + subject.uri + 'r\n'
  const VERSIONV = 'VERSION:4.0\r\n'

// find out how to import values from presenter.ts
// once those values are imported, make sure any user input aligns

  const vCard: string = BEGIN + FN + URL + END + VERSIONV

  // console.log(`@@ qrcodes colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)
   
  return html`
    <figure 
      class="QRCode"
      data-value="${vCard}"
      highlightColor="${hC}"
      backgroundColor="${bC}"
      data-testid="qrcode-card"
      aria-labelledby="qr-code-caption"
      role="img"
      aria-describedby="qr-code-description"
    >
      <div 
        aria-label="QR code containing contact information for ${name}"
        role="img"
      ></div>
      <figcaption 
        id="qr-code-caption" 
        class="qrCaption"
      >
        ${scanQrToConnectText}
      </figcaption>
      <div 
        id="qr-code-description" 
        class="sr-only"
      >
        QR code contains vCard information for ${name} including profile URL ${subject.uri}
      </div>
    </figure>
  `
}
