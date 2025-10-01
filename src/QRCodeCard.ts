import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { ProfilePresentation } from './presenter'
import { utils } from 'solid-ui'
import * as styles from './styles/QRCodeCard.module.css'


export const QRCodeCard = (
  profileBasics: ProfilePresentation,
  subject: NamedNode
): TemplateResult => {
  const highlightColor = profileBasics.highlightColor || '#000000'
  const backgroundColor = profileBasics.backgroundColor || '#ffffff'
 
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
      <header aria-label="QR Code Header">
        <h3 id="qr-card-title" class="${styles.qrTitle}">${profileBasics.name}</h3>
      </header>
      <div class="${styles.qrCodeBox}" aria-label="QR Code" role="img">
        <div class="QRCode"
            style="width:80%;margin:auto;"
            data-value="${vCard}"
            highlightColor="${highlightColor}"
            backgroundColor="${backgroundColor}">
        </div>
      </div>
    </section>
  `
}
