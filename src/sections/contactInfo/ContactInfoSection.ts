import { html } from 'lit-html'
import { ViewerMode } from '../../types'
import { createContactInfoEditDialog } from './ContactInfoEditDialog'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import { contactInfoHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'

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

function normalizeContactValue(rawValue: string, kind: 'email' | 'phone'): string {
  if (!rawValue) return ''
  return kind === 'email'
    ? rawValue.replace(/^mailto:/i, '')
    : rawValue.replace(/^tel:/i, '')
}

function resolveContactValue(store: LiveStore, point: any, kind: 'email' | 'phone'): string {
  if (!point) return ''

  const directValue = toText(point.valueNode || point.entryNode).trim()
  const looksLikeExpectedValue = kind === 'email'
    ? /^mailto:/i.test(directValue) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(directValue)
    : /^tel:/i.test(directValue) || /^[+()\-\s\d]{5,}$/.test(directValue)

  if (looksLikeExpectedValue) {
    return normalizeContactValue(directValue, kind)
  }

  const entryNode = point.entryNode || point.valueNode
  if (entryNode) {
    const storedValueNode = store.any(entryNode as NamedNode, ns.vcard('value'))
    const storedValue = toText(storedValueNode).trim()
    if (storedValue) return normalizeContactValue(storedValue, kind)
  }

  return normalizeContactValue(directValue, kind)
}


function renderPhone(phone, store: LiveStore) {
  if (!phone) return html``
  const phoneValue = resolveContactValue(store, phone, 'phone')
  const phoneType = formatTypeLabel(phone.type)

  return html`<li class="phone" role="listitem">
        ${phoneValue}
        ${phoneType ? html`<span class="phone-type"> (${phoneType})</span>` : html``}
      </li>`
}

function renderPhones(phones, store: LiveStore) {
  if (!phones || !phones.length || !phones[0]) return html``
  return html`${renderPhone(phones[0], store)}${phones.length > 1 ? renderPhones(phones.slice(1), store) : html``}`
}

function renderEmail(email, store: LiveStore) {
  if (!email) return html``
  const emailValue = resolveContactValue(store, email, 'email')
  const emailType = formatTypeLabel(email.type)

  return html`<li class="email" role="listitem">
        ${emailValue}
        ${emailType ? html`<span class="email-type"> (${emailType})</span>` : html``}
      </li>`
}

function renderEmails(emails, store: LiveStore) {
  if (!emails || !emails.length || !emails[0]) return html``
  return html`${renderEmail(emails[0], store)}${emails.length > 1 ? renderEmails(emails.slice(1), store) : html``}`
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

export function renderContactInfoSection(
  store: LiveStore,
  subject: NamedNode,
  contactInfo,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const safeContactInfo = {
    emails: contactInfo?.emails || [],
    phones: contactInfo?.phones || [],
    addresses: contactInfo?.addresses || []
  }
  const hasAnyContactInfo =
    safeContactInfo.emails.length > 0 ||
    safeContactInfo.phones.length > 0 ||
    safeContactInfo.addresses.length > 0

  return html`
    <section
      aria-labelledby="contact-details-heading"
      class="profile__section border-lighter profile-section-collapsible"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="contact-details-heading" tabindex="-1">${contactInfoHeadingText}</h2>
        <div class="profile-section-collapsible__actions">
          <button 
            type="button" 
            class="profile__action-button u-profile-action-text profile-section-collapsible__edit-button" 
            aria-label="Edit contact information"
            @click=${(event: Event) => {
              return createContactInfoEditDialog(
                event,
                store,
                subject,
                safeContactInfo,
                viewerMode,
                onSaved
              )
            }}>
            <span class="profile-section-collapsible__edit-label">✎ Edit</span>
            <span class="profile-section-collapsible__edit-icon" aria-hidden="true">✎</span>
          </button>
          <button
            type="button"
            class="profile-section-collapsible__toggle"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="contact-details-panel" class="profile-section-collapsible__content" aria-hidden="true">
        ${safeContactInfo.phones.length > 0
          ? html`
              <ul role="list" aria-label="Phone numbers">
                ${renderPhones(safeContactInfo.phones, store)}
              </ul>
            `
          : html``}
        ${safeContactInfo.emails.length > 0
          ? html`
              <ul role="list" aria-label="Email addresses">
                ${renderEmails(safeContactInfo.emails, store)}
              </ul>
            `
          : html``}
        ${safeContactInfo.addresses.length > 0
          ? html`
              <ul role="list" aria-label="Postal addresses">
                ${renderAddresses(safeContactInfo.addresses)}
              </ul>
            `
          : html``}
        ${hasAnyContactInfo ? html`` : html`<p>No contact details added yet.</p>`}
      </div>
    </section>
  `
}
