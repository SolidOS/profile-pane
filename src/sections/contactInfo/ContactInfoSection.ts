import { html, nothing } from 'lit-html'
import 'solid-ui/components/button'
import { Layout, ViewerMode } from '../../types'
import { createContactInfoEditDialog } from './ContactInfoEditDialog'
import { LiveStore, NamedNode } from 'rdflib'
import { ns } from 'solid-ui'
import './ContactInfoSection.css'
import { contactInfoEmptyHeadingText, contactInfoHeadingText } from '../../texts'
import { toggleCollapsibleSection } from '../shared/collapsibleSection'
import { ContactInfo } from './types'
import { splitPhoneValue } from '../shared/phoneCountries'
import { normalizeEmailTypeForEdit, normalizePhoneTypeForEdit } from '../shared/contactTypeUtils'
import { addIcon, chevronDownIcon, editIcon, envelopeIcon, locationIcon } from '../../icons-svg/profileIcons'
import { emailIcon, phoneIcon } from '../../icons-svg/contactIcons'
import { renderResponsiveActionButton } from '../../ui/responsiveActionButton'

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
  if (kind === 'email') {
    return rawValue.replace(/^mailto:/i, '')
  }

  const normalizedPhone = rawValue.replace(/^tel:/i, '')
  const { localNumber } = splitPhoneValue(normalizedPhone)
  return localNumber || normalizedPhone
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

  return html`<li class="contact-info__item" role="listitem">
        <div class="contact-info__icon-wrapper">
          <span class="contact-info__icon" aria-hidden="true">${phoneIcon}</span>
        </div>
        <div class="contact-info__item-body">
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

  return html`<li class="contact-info__item" role="listitem">
        <div class="contact-info__icon-wrapper">
          <span class="contact-info__icon" aria-hidden="true">${emailIcon}</span>
        </div>
        <div class="contact-info__item-body">
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
        <li class="contact-info__item" role="listitem">
          <div class="contact-info__icon-wrapper">
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
  layout: Layout,
  onSaved?: () => Promise<void> | void) {
    const hasAnyContactInfo =
    contactInfo?.emails.length > 0 ||
    contactInfo?.phones.length > 0 ||
    contactInfo?.addresses.length > 0
    const isOwner = viewerMode === 'owner'

  return html`
    <section
      aria-labelledby="contact-details-heading"
      data-profile-section="contact-info"
      class="profile__section profile-section-collapsible profile-section-collapsible--inline-mobile-actions"
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h3 id="contact-details-heading" tabindex="-1">${contactInfoHeadingText}</h3>
        <div class="profile-section-collapsible__actions">
          ${isOwner ? html`
              ${renderResponsiveActionButton({
                layout,
                className: 'profile-section-collapsible__edit-button',
                ariaLabel: 'Edit contact information',
                onClick: (event: Event) => createContactInfoEditDialog(event, store, subject, contactInfo, viewerMode, onSaved),
                desktopIcon: html`<span slot="left-icon" class="profile-section-collapsible__action-label profile__add-more-icon" aria-hidden="true">${addIcon}</span>`,
                desktopLabel: 'Add More',
                mobileIcon: html`<span slot="icon" class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>`
              })}
            ` : nothing}
          <solid-ui-button
            variant="ghost"
            class="profile-section-collapsible__toggle-button"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">${chevronDownIcon}</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="contact-details-panel" class="profile-section-collapsible__content">
        ${contactInfo.phones.length > 0
          ? html`
              <ul class="contact-info__list" role="list" aria-label="Phone numbers">
                ${renderPhones(contactInfo.phones, store)}
              </ul>
            `
          : html``}
        ${contactInfo.emails.length > 0
          ? html`
              <ul class="contact-info__list" role="list" aria-label="Email addresses">
                ${renderEmails(contactInfo.emails, store)}
              </ul>
            `
          : html``}
        ${contactInfo.addresses.length > 0
          ? html`
              <ul class="contact-info__list" role="list" aria-label="Postal addresses">
                ${renderAddresses(contactInfo.addresses)}
              </ul>
            `
          : html``}
        ${hasAnyContactInfo ? nothing : html`<p>No contact details added yet.</p>`}
      </div>
    </section>
  `
}

function renderOwnerEmptyContactInfoContent() {
  return html`
      <div class="profile__empty-state-content" role="group" aria-label="Empty contact information section">    
        <div class="contact-info__empty-icon-wrapper">
          <span class="contact-info__empty-icon">${envelopeIcon}</span>
        </div>
      </div>
  `
}

function renderOwnerEmptyContactInfoSection(
  store: LiveStore,
  subject: NamedNode,
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  layout: Layout,
  onSaved?: () => Promise<void> | void
) {
  return html`
    <section 
      aria-labelledby="contact-details-heading" 
      data-profile-section="contact-info"
      class="profile__section--empty profile__section--empty-sidebar profile-section-collapsible profile-section-collapsible--inline-mobile-actions" 
      role="region"
      tabindex="-1"
      data-expanded="false"
    >
      <header class="profile__section-header profile-section-collapsible__header">
        <h3 id="contact-details-heading" tabindex="-1">${contactInfoEmptyHeadingText}</h3>
        <div class="profile-section-collapsible__actions">
         ${renderResponsiveActionButton({
                    layout,
                    className: 'profile-section-collapsible__edit-button',
                    ariaLabel: 'Add contact information',
                    onClick: (event: Event) => {
                      return createContactInfoEditDialog(
                        event,
                        store,
                        subject,
                        contactInfo,
                        viewerMode,
                        onSaved
                      )
                    },
                    desktopIcon: html`<span slot="left-icon" class="profile-section-collapsible__action-label profile__add-more-icon" aria-hidden="true">${addIcon}</span>`,
                    desktopLabel: 'Add More',
                    mobileIcon: html`<span slot="icon" class="profile-section-collapsible__edit-icon" aria-hidden="true">${editIcon}</span>`
                  })}
          <solid-ui-button
            variant="ghost"
            class="profile-section-collapsible__toggle-button"
            aria-label="Toggle contact information section"
            aria-controls="contact-details-panel"
            aria-expanded="false"
            @click=${toggleCollapsibleSection}
          >
            <span slot="icon" class="profile-section-collapsible__chevron" aria-hidden="true">${chevronDownIcon}</span>
          </solid-ui-button>
        </div>
      </header>
      <div id="contact-details-panel" class="profile-section-collapsible__content">
        ${renderOwnerEmptyContactInfoContent()}
      </div>
    </section>
  `
}

export function renderContactInfoSection(
  store: LiveStore,
  subject: NamedNode,
  contactInfo: ContactInfo,
  viewerMode: ViewerMode,
  layout: Layout,
  onSaved?: () => Promise<void> | void
) {
  const currentLayout = layout || 'desktop'
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

  return html`
    ${showOwnerEmptyContactInfo
      ? renderOwnerEmptyContactInfoSection(store, subject, safeContactInfo, viewerMode, currentLayout, onSaved)
      : renderContactInfoSectionDefault(store, subject, safeContactInfo, viewerMode, currentLayout, onSaved)}
  `
}
