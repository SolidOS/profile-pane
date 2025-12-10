import qrCodeCardCss from './styles/QRCodeCard.css'
import { html, render } from 'lit-html'
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js'
import { utils } from 'solid-ui'
import { scanQrToConnectText } from './texts'
import globalCssText from './styles/global.css'
import * as qrcode from 'qrcode'

class QRCodeCardElement extends HTMLElement {
    private _highlightColor: any
    private _backgroundColor: any
    private _subject: any
  static sheet: CSSStyleSheet | null = null
  shadow: ShadowRoot
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }
  async connectedCallback() {
    let globalSheet: CSSStyleSheet | null = null
    let cardSheet: CSSStyleSheet | null = null
    let canUseSheets = typeof CSSStyleSheet !== 'undefined' && typeof globalCssText === 'string' && typeof qrCodeCardCss === 'string'
    try {
      if (canUseSheets) {
        globalSheet = new CSSStyleSheet()
        globalSheet.replaceSync(globalCssText)
        if (!QRCodeCardElement.sheet) {
          QRCodeCardElement.sheet = new CSSStyleSheet()
          QRCodeCardElement.sheet.replaceSync(qrCodeCardCss)
        }
        cardSheet = QRCodeCardElement.sheet
      }
    } catch (e) {
      globalSheet = null
      cardSheet = null
    }
    if ('adoptedStyleSheets' in Document.prototype && globalSheet && cardSheet) {
      this.shadow.adoptedStyleSheets = [globalSheet, cardSheet]
    } else {
      // Fallback for browsers or test environments without adoptedStyleSheets or CSSStyleSheet
      if (typeof globalCssText === 'string') {
        const styleGlobal = document.createElement('style')
        styleGlobal.textContent = globalCssText
        this.shadow.appendChild(styleGlobal)
      }
      if (typeof qrCodeCardCss === 'string') {
        const styleCard = document.createElement('style')
        styleCard.textContent = qrCodeCardCss
        this.shadow.appendChild(styleCard)
      }
    }
    this.render()
  }
  async render() {
    const highlightColor = this.highlightColor || '#000000'
    const backgroundColor = this.backgroundColor || '#ffffff'
    const subject = this.subject
    if (!subject) {
      render(html``, this.shadow)
      return
    }
    const name = utils.label(subject)
    const BEGIN = 'BEGIN:VCARD\r\n'
    const END = 'END:VCARD\r\n'
    const FN = 'FN:' + name + '\r\n'
    const URL = 'URL:' + subject.uri + '\r\n'
    const VERSIONV = 'VERSION:4.0\r\n'
    const vCard: string = BEGIN + FN + URL + END + VERSIONV
    let svg = ''
    try {
      svg = await qrcode.toString(vCard, {
        type: 'svg',
        color: {
          dark: highlightColor,
          light: backgroundColor
        }
      })
    } catch (error) {
      svg = '<span>QRcode error!</span>'
      console.error('QRcode error!', error)
    }
    render(html`

        <figure 
          class="QRCode"
          data-value="${vCard}"
          highlightColor="${highlightColor}"
          backgroundColor="${backgroundColor}"
          data-testid="qrcode-card"
          aria-labelledby="qr-code-caption"
          role="img"
          aria-describedby="qr-code-description"
        >
          <div 
            aria-label="QR code containing contact information for ${name}"
            role="img"
          >${unsafeHTML(svg)}</div>
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

    `, this.shadow)
  }
  get highlightColor() {
    return this._highlightColor
  }
  set highlightColor(val) {
    this._highlightColor = val
    this.render()
  }
  get backgroundColor() {
    return this._backgroundColor
  }
  set backgroundColor(val) {
    this._backgroundColor = val
    this.render()
  }
  get subject() {
    return this._subject
  }
  set subject(val) {
    this._subject = val
    this.render()
  }
}
customElements.define('qrcode-card', QRCodeCardElement)
