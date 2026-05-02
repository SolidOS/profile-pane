import { html } from 'lit-html'
import 'solid-ui/components/actions/button'
import { ViewerMode } from '../../types'
import { createContactInfoEditDialog } from './ContactInfoEditDialog'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import '../../styles/ContactInfoSection.css'
import { contactInfoEmptyHeadingText, contactInfoHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { ContactInfo } from './types'
import { normalizeEmailTypeForEdit, normalizePhoneTypeForEdit } from '../shared/contactTypeUtils'
import { addIcon, editIcon, envelopeIcon, locationIcon, plusIcon } from '../../icons-svg/profileIcons'
import { emailIcon, phoneIcon } from '../../icons-svg/contactIcons'

function toText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    const v = (value as { value?: unknown }).value
    return typeof v === 'string' ? v : ''
  }
  return ''
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
  const phoneType = normalizePhoneTypeForEdit(phone.type)

  return html`<li class="contact-info__item flex gap-2xs" role="listitem">
        <div class="contact-info__icon-wrapper flex-center">
          <span class="contact-info__icon" aria-hidden="true">${phoneIcon}</span>
        </div>
        <div class="flex-column">
          <span class="contact-info__contact-point-value">${phoneValue}</span>
          ${phoneType ? html`<span class="contact-info__contact-point-type"> ${phoneType}</span>` : html``}
        </div>
      </li>`
}

function renderPhones(phones, store: LiveStore) {
  if (!phones || !phones.length || !phones[0]) return html``
  return html`${renderPhone(phones[0], store)}${phones.length > 1 ? renderPhones(phones.slice(1), store) : html``}`
}

function renderEmail(email, store: LiveStore) {
  if (!email) return html``
  const emailValue = resolveContactValue(store, email, 'email')
  const emailType = normalizeEmailTypeForEdit(email.type)

  return html`<li class="contact-info__item flex gap-2xs" role="listitem">
        <div class="contact-info__icon-wrapper flex-center">
          <span class="contact-info__icon" aria-hidden="true">${emailIcon}</span>
        </div>
        <div class="flex-column">
          <span class="contact-info__contact-point-value">${emailValue}</span>
          ${emailType ? html`<span class="contact-info__contact-point-type">${emailType}</span>` : html``}
        </div>
      </li>`
}

function renderEmails(emails, store: LiveStore) {
  if (!emails || !emails.length || !emails[0]) return html``
  return html`${renderEmail(emails[0], store)}${emails.length > 1 ? renderEmails(emails.slice(1), store) : html``}`
}

function renderAddress(address) {
  if (!address) return html``
  const streetAddress = toText(address.streetAddress || address.fullAddress).trim()
  const locality = toText(address.locality).trim()
  const region = toText(address.region).trim()
  const postalCode = toText(address.postalCode).trim()
  const countryName = toText(address.countryName).trim()

  const localityRegion = [locality, region].filter(Boolean).join(', ')
  const localityRegionPostal = [localityRegion, postalCode].filter(Boolean).join(' ')

  return html`
        <li class="contact-info__item flex gap-2xs" role="listitem">
          <div class="contact-info__icon-wrapper flex-center">
            <span class="contact-info__icon" aria-hidden="true">${locationIcon}</span>
          </div>
          <span class="contact-info__address">
            ${streetAddress ? html`${streetAddress}<br />` : html``}
            ${localityRegionPostal ? html`${localityRegionPostal}<br />` : html``}
            ${countryName}
          </span>
        </li>`
}

function renderAddresses(addresses) {
  if (!addresses || !addresses.length || !addresses[0]) return html``
  return html`${renderAddress(addresses[0])}${addresses.length > 1 ? renderAddresses(addresses.slice(1)) : html``}`
}

function renderContactInfoSectionDefault(
  store: LiveStore, 
  subject: NamedNode, 
  contactInfo: ContactInfo,
  viewerMode: ViewerMode, 
  onSaved?: () => Promise<void> | void) {
    const hasAnyContactInfo =
    contactInfo?.emails.length > 0 ||
    contactInfo?.phones.length > 0 ||
    contactInfo?.addresses.length > 0
    const isOwner = viewerMode === 'owner'

  return html`
    <section
      aria-labelledby="contact-details-heading"
      class="profile__section border-lighter profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="contact-details-heading" tabindex="-1">${contactInfoHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          ${isOwner ? html`
            <solid-ui-button
              type="button"
              variant="secondary"
              size="sm"
              class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
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
              }}
            >
              <span class="profile-section-collapsible__edit-label">${editIcon} Edit</span>
              <span class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>
            </solid-ui-button>
          ` : html``}
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            label="Toggle contact information section"
            class="inline-flex-row justify-center"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="contact-details-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
        ${contactInfo.phones.length > 0
          ? html`
              <ul class="contact-info__list flex-column" role="list" aria-label="Phone numbers">
                ${renderPhones(contactInfo.phones, store)}
              </ul>
            `
          : html``}
        ${contactInfo.emails.length > 0
          ? html`
              <ul class="contact-info__list flex-column" role="list" aria-label="Email addresses">
                ${renderEmails(contactInfo.emails, store)}
              </ul>
            `
          : html``}
        ${contactInfo.addresses.length > 0
          ? html`
              <ul class="contact-info__list flex-column" role="list" aria-label="Postal addresses">
                ${renderAddresses(contactInfo.addresses)}
              </ul>
            `
          : html``}
        ${hasAnyContactInfo ? html`` : html`<p>No contact details added yet.</p>`}
      </div>
    </section>
  `
}

function renderOwnerEmptyContactInfoContent(
  _store: LiveStore,
  _subject: NamedNode,
  _contactInfo: ContactInfo,
  _viewerMode: ViewerMode,
  _onSaved?: () => Promise<void> | void
) {
  return html`
      <div class="profile__empty-state-content flex-column-center" role="group" aria-label="Empty contact information section">    
        <div class="contact-info__empty-icon-wrapper">
          <span class="contact-info__empty-icon inline-flex-row">${envelopeIcon}</span>
        </div>
        <p class="profile__empty-state-message contact-info__empty-message">
            No additional contact info added yet.
        </p>
      </div>
  `
}

function renderOwnerEmptyContactInfoSection(
  store: LiveStore,
  subject: NamedNode,
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="contact-details-heading" 
      data-profile-section="contact-info"
      class="profile__section--empty border-lighter rounded-md gap-lg profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h2 id="contact-details-heading" tabindex="-1">${contactInfoEmptyHeadingText}</h2>
        <div class="profile-section-collapsible__actions flex-column align-end">
          <solid-ui-button
            type="button"
            variant="secondary"
            size="sm"
            class="profile__action-button profile-action-text flex-center profile-section-collapsible__edit-button"
            aria-label="Add contact information"
            @click=${(event: Event) => {
              return createContactInfoEditDialog(
                event,
                store,
                subject,
                contactInfo,
                viewerMode,
                onSaved
              )
            }}
          >
            <span class="profile-section-collapsible__edit-label">${addIcon} Add Contact</span>
            <span class="profile-section-collapsible__edit-icon profile-section-collapsible__edit-icon--add" aria-hidden="true">${plusIcon}</span>
          </solid-ui-button>
          <solid-ui-button
            type="button"
            variant="icon"
            size="sm"
            label="Toggle contact information section"
            class="inline-flex-row justify-center"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">⌄</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="contact-details-panel" class="profile-section-collapsible__content" aria-hidden="true" hidden>
        ${renderOwnerEmptyContactInfoContent(store, subject, contactInfo, viewerMode, onSaved)}
      </div>
    </section>
  `
}

export function renderContactInfoSection(
  store: LiveStore,
  subject: NamedNode,
  contactInfo: ContactInfo,
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
  const showOwnerEmptyContactInfo = !hasAnyContactInfo && viewerMode === 'owner'
  const showSection = true
  
  return showSection ? html`
    ${showOwnerEmptyContactInfo
      ? renderOwnerEmptyContactInfoSection(store, subject, safeContactInfo, viewerMode, onSaved)
      : renderContactInfoSectionDefault(store, subject, safeContactInfo, viewerMode, onSaved)}
  ` : ''
  
}
