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

  // Accessibility check: Ensure QR code is rendered as an accessible image or canvas
  // This assumes the QR code is rendered inside the <div> below by another library or script.
  // If you use a library, ensure it sets role="img" and an appropriate aria-label or alt attribute.
  // If not, warn the developer.
  setTimeout(() => {
    const container = document.querySelector('.QRCode [role="img"]')
    if (container) {
      const hasAriaLabel = container.hasAttribute('aria-label')
      const hasAlt = container.hasAttribute('alt')
      if (!hasAriaLabel && !hasAlt) {
         
        console.warn('QRCodeCard: The QR code element should have an accessible label (aria-label or alt attribute) for screen readers.')
      }
    } else {
       
      console.warn('QRCodeCard: No element with role="img" found for the QR code. Ensure the QR code is rendered as an <img> or <canvas> with proper ARIA attributes.')
    }
  }, 0)

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
