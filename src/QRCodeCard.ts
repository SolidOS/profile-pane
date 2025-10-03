import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { utils } from 'solid-ui'
import * as styles from './styles/QRCodeCard.module.css'


export const QRCodeCard = (
  highlightColor: string, backgroundColor: string,
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
    <section
      class="${styles.qrCard}"
      aria-labelledby="qr-card-title"
      role="region"
      data-testid="qrcode-card"
    >
        <div class="QRCode"
            data-value="${vCard}"
            highlightColor="${hC}"
            backgroundColor="${bC}">
          </div>
      
    </section>
  `
}
