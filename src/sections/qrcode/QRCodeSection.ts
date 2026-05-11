import { html } from 'lit-html'
import { QRCodeCard } from './QRCodeCard'
import { LiveStore, NamedNode } from 'rdflib'
import '../../styles/QRCodeSection.css'
import { scanQrToConnectText } from '../../texts'

export function renderQRCodeSection(subject: NamedNode, store: LiveStore) {
  return html`
      <section class="profile__section profile__qr-code" data-profile-section="qr-code" aria-labelledby="qr-heading" tabindex="-1">
        <h2 id="qr-heading" class="sr-only">QR code</h2>
        <div class="qrcode-card__frame">
          ${QRCodeCard(subject, store)}
        </div>
        <figcaption 
          id="qr-code-caption" 
          class="qrcode-card__caption"
        >
          ${scanQrToConnectText}
        </figcaption>
      </section>
  `
}
