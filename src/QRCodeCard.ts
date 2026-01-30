import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdflib'
import { utils } from 'solid-ui'
import './styles/QRCodeCard.css'
import { scanQrToConnectText } from './texts'



function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove leading # if present
  hex = hex.replace(/^#/, '')
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('')
  }
  if (hex.length !== 6) return null
  const num = parseInt(hex, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const a = [r, g, b].map(function (v) {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 1
  const lum1 = luminance(rgb1)
  const lum2 = luminance(rgb2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

export const QRCodeCard = (
  highlightColor: string, 
  backgroundColor: string,
  subject: NamedNode
): TemplateResult => {
  const hC = highlightColor || '#000000'
  const bC = backgroundColor || '#ffffff'
  const name = utils.label(subject)

  // Color contrast check
  const ratio = contrastRatio(hC, bC)
  if (ratio < 4.5) {
     
    console.warn(
      `QRCodeCard: The contrast ratio between highlightColor (${hC}) and backgroundColor (${bC}) is ${ratio.toFixed(2)}, which is below the WCAG 2.1 recommended minimum of 4.5:1 for normal text.`
    )
  }

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
      highlightColor="${hC}"
      backgroundColor="${bC}"
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
