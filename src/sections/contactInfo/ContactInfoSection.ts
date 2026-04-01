import { html } from "lit-html"
import { ViewerMode } from "../../types"

function renderPhone(phone, asList = false) {
  if (!phone) return html``
  const rawPhoneValue = phone.phoneNumber?.value || phone.value || ''
  const phoneValue = rawPhoneValue.replace(/^tel:/i, '')
  const rawType = phone.type?.value || ''
  const phoneType = rawType ? rawType.split('#').pop()?.split('/').pop() : ''
  return asList
    ? html`<li class="phone">
        ${phoneValue}
        ${phoneType ? html`<span class="phone-type"> (${phoneType})</span>` : html``}
      </li>`
    : html``
}

function renderPhones(phones, asList = false) {
  if (!phones || !phones.length || !phones[0]) return html``
  return html`${renderPhone(phones[0], asList)}${phones.length > 1 ? renderPhones(phones.slice(1), asList) : html``}`
}


function renderAddress(address, asList = false) {
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
  return asList
    ? html`<li class="address">${formattedAddress}</li>`
    : html``
}

function renderAddresses(addresses, asList = false) {
  if (!addresses || !addresses.length || !addresses[0]) return html``
  return html`${renderAddress(addresses[0], asList)}${addresses.length > 1 ? renderAddresses(addresses.slice(1), asList) : html``}`
}

export function renderContactInfoSection(contactDetails, viewerMode: ViewerMode) {
  return contactDetails && (contactDetails.emails.length > 0 || contactDetails.phones.length > 0 || contactDetails.addresses.length > 0) ? html`
    <section
      aria-labelledby="contact-details-heading"
      class="section-bg"
      role="region"
      tabindex="-1"
    >
      <header class="mb-md">
        <h3 id="contact-details-heading" tabindex="-1">Contact Info</h3>
      </header>
      <div>
        ${renderPhones(contactDetails.phones, true)}
        ${renderAddresses(contactDetails.addresses, true)}
      </div>
    </section>
  ` : ''
}
