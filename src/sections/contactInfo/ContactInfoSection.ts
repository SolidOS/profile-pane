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
  return contactInfo && (contactInfo.emails.length > 0 || contactInfo.phones.length > 0 || contactInfo.addresses.length > 0) ? html`
    <section
      aria-labelledby="contact-details-heading"
      class="profileSectionCollapsible section-bg"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profileSectionCollapsible__header">
        <h3 id="contact-details-heading" tabindex="-1">${contactInfoHeadingText}</h3>
        <div class="profileSectionCollapsible__actions">
          <button 
            type="button" 
            class="profile__action-button u-profile-action-text profileSectionCollapsible__editButton" 
            aria-label="Edit contact information"
            @click=${(event: Event) => {
              return createContactInfoEditDialog(
                event,
                store,
                subject,
                contactInfo,
                viewerMode,
                onSaved
              )
            }}>
            <span class="profileSectionCollapsible__editLabel">✎ Edit</span>
            <span class="profileSectionCollapsible__editIcon" aria-hidden="true">✎</span>
          </button>
          <button
            type="button"
            class="profileSectionCollapsible__toggle"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span class="profileSectionCollapsible__chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>
      <div id="contact-details-panel" class="profileSectionCollapsible__content" aria-hidden="true">
        ${contactInfo.phones.length > 0
          ? html`
              <ul role="list" aria-label="Phone numbers">
                ${renderPhones(contactInfo.phones, store)}
              </ul>
            `
          : html``}
        ${contactInfo.emails.length > 0
          ? html`
              <ul role="list" aria-label="Email addresses">
                ${renderEmails(contactInfo.emails, store)}
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
