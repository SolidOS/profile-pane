import { html } from "lit-html";
import { QRCodeCard } from "./QRCodeCard";
import { LiveStore, NamedNode } from "rdflib";

export function renderQRCode(subject: NamedNode, store: LiveStore) {
  return html`
      <section class="profile__section border-lighter profile__qr-code" aria-labelledby="qr-heading" tabindex="-1">
        <h2 id="qr-heading" class="sr-only">QR code</h2>
        <div class="qrcode-card__frame flex-center">
          ${QRCodeCard(subject, store)}
        </div>
      </section>
  `
}
