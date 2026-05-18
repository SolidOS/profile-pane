import { html } from 'lit-html'
import { QRCodeCard } from './QRCodeCard'
import { LiveStore, NamedNode } from 'rdflib'
import './QRCodeSection.css'

export function renderQRCodeSection(subject: NamedNode, store: LiveStore) {
  return html`
      <section class="profile__section profile__qr-code" data-profile-section="qr-code" aria-labelledby="qr-heading" tabindex="-1">
        <h3 id="qr-heading" class="sr-only">QR code</h3>
        ${QRCodeCard(subject, store)}
      </section>
  `
}
