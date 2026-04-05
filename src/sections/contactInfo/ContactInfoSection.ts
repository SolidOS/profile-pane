import { html } from "lit-html"
import { ViewerMode } from "../../types"
import { createContactInfoEditDialog } from "./ContactInfoEditDialog"
import { LiveStore, NamedNode } from "rdflib"
import { contactInfoHeadingText } from "../../texts"

function toText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    const v = (value as { value?: unknown }).value
    return typeof v === 'string' ? v : ''
  }
  return ''
}
/* AI generated helper code Model: GPT-5.3-Codex */
/* Prompt: can you convert http://www.w3.org/2006/vcard/ns#Home now display as Home */
function formatTypeLabel(value: unknown): string {
  const raw = toText(value).trim()
  if (!raw) return ''

  // Keep labels human-friendly when rdf type is a full URI.
  const withoutAngles = raw.replace(/^<|>$/g, '')
  const hashParts = withoutAngles.split('#')
  const lastByHash = hashParts[hashParts.length - 1]
  const slashParts = lastByHash.split('/')
  return slashParts[slashParts.length - 1]
}


function renderPhone(phone) {
  if (!phone) return html``
  const phoneValue = toText(phone.valueNode).replace(/^tel:/i, '')
  const phoneType = formatTypeLabel(phone.type)

  return html`<li class="phone" role="listitem">
        ${phoneValue}
        ${phoneType ? html`<span class="phone-type"> (${phoneType})</span>` : html``}
      </li>`
}

function renderPhones(phones) {
  if (!phones || !phones.length || !phones[0]) return html``
  return html`${renderPhone(phones[0])}${phones.length > 1 ? renderPhones(phones.slice(1)) : html``}`
}

function renderEmail(email) {
  if (!email) return html``
  const emailValue = toText(email.valueNode).replace(/^mailto:/i, '')
  const emailType = formatTypeLabel(email.type)

  return html`<li class="email" role="listitem">
        ${emailValue}
        ${emailType ? html`<span class="email-type"> (${emailType})</span>` : html``}
      </li>`
}

function renderEmails(emails) {
  if (!emails || !emails.length || !emails[0]) return html``
  return html`${renderEmail(emails[0])}${emails.length > 1 ? renderEmails(emails.slice(1)) : html``}`
}

function renderAddress(address) {
  if (!address) return html``
  const pieces = [
    address.fullAddress?.value || address.fullAddress,
    address.streetAddress?.value || address.streetAddress,
    address.locality?.value || address.locality,
    address.region?.value || address.region,
    address.postalCode?.value || address.postalCode,
    address.countryName?.value || address.countryName,
  ].filter(Boolean)
  const formattedAddress = pieces.join(', ')
  return html`<li class="address" role="listitem">${formattedAddress}</li>`
}

function renderAddresses(addresses) {
  if (!addresses || !addresses.length || !addresses[0]) return html``
  return html`${renderAddress(addresses[0])}${addresses.length > 1 ? renderAddresses(addresses.slice(1)) : html``}`
}

export function renderContactInfoSection(store: LiveStore, subject: NamedNode, contactInfo, viewerMode: ViewerMode) {
  return contactInfo && (contactInfo.emails.length > 0 || contactInfo.phones.length > 0 || contactInfo.addresses.length > 0) ? html`
    <section
      aria-labelledby="contact-details-heading"
      class="section-bg"
      role="region"
      tabindex="-1"
    >
      <header class="sectionHeader mb-md">
        <h3 id="contact-details-heading" tabindex="-1">${contactInfoHeadingText}</h3>
        <button 
          type="button" 
          class="actionButton" 
          aria-label="Edit contact information"
          @click=${(event: Event) => {
            return createContactInfoEditDialog(
              event,
              store,
              subject,
              contactInfo,
              viewerMode
            )
          }}>
          <span class="actionIcon" aria-hidden="true">✎ Edit</span>
        </button>
      </header>
      <div>
        ${contactInfo.phones.length > 0
          ? html`
              <ul role="list" aria-label="Phone numbers">
                ${renderPhones(contactInfo.phones)}
              </ul>
            `
          : html``}
        ${contactInfo.emails.length > 0
          ? html`
              <ul role="list" aria-label="Email addresses">
                ${renderEmails(contactInfo.emails)}
              </ul>
            `
          : html``}
        ${contactInfo.addresses.length > 0
          ? html`
              <ul role="list" aria-label="Postal addresses">
                ${renderAddresses(contactInfo.addresses)}
              </ul>
            `
          : html``}
      </div>
    </section>
  ` : ''
}
