import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { utils } from 'solid-ui'
import './styles/QRCodeCard.css'
import { scanQrToConnectText } from './texts'


export const QRCodeCard = (
  subject: NamedNode
): TemplateResult => {
  const name = utils.label(subject)

  const BEGIN = 'BEGIN:VCARD\r\n'
  const END = 'END:VCARD\r\n'
  const FN = 'FN:' + name + '\r\n'
  const URL = 'URL:' + subject.uri + 'r\n'
  const VERSIONV = 'VERSION:4.0\r\n'

  const vCard: string = BEGIN + FN + URL + END + VERSIONV

  // console.log(`@@ qrcodes colours highlightColor ${highlightColor}, backgroundColor ${backgroundColor}`)
  
   
  return html`
    <figure 
      class="QRCode"
      data-value="${vCard}"
      data-testid="qrcode-card"
      aria-labelledby="qr-code-caption"
      role="img"
      aria-describedby="qr-code-description"
    >
      <div 
        aria-label="Static QR code containing contact information for ${name}"
        role="img"
        tabindex="0"
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
        This is a static QR code containing vCard information for ${name}, including profile URL ${subject.uri}. The QR code is not interactive.
      </div>
    </figure>
  `
}
