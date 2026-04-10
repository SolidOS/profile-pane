import { openInputDialog } from '../../ui/dialog'
import { html, render, TemplateResult } from 'lit-html'
import { ProfileDetails, HeadingMutationPlan, ProfileBasicRow } from './types'
import { Image } from './HeadingSection'
import '../../styles/EditDialogs.css'
import { LiveStore, NamedNode } from 'rdflib'
import { processHeadingMutations } from './mutations'
import { ViewerMode } from '../../types'
import {
  combinePhoneValue,
  splitPhoneValue
} from '../shared/phoneCountries'
import { applyRowFieldChange, applyRowSelectChange, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText, toTypeLabel } from '../../textUtils'
import {
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editHeadingDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveHeadingUpdatesFailedPrefixText
} from '../../texts'
import { ContactAddressRow, ContactPointRow } from '../contactInfo/types'
import { sanitizeAddressFieldValue, sanitizeBasicInputFieldValue, sanitizeEmailValue, sanitizePhoneLocalValue } from '../shared/sanitizeUtils'
import { toStorageDateISO } from './dateHelpers'
/* Note: new design - has address type in More Edit Contacts for now we will leave
         out Address Type, but a ticket will be created to add type later
         so I will keep the code and just comment it out for now. 
         new design - has country code, will comment out code for now and create a ticket to add later. */

type HeadingFormState = {
  basicInfo: ProfileBasicRow
  email: ContactPointRow
  phone: ContactPointRow
  address: ContactAddressRow
}

type Row = ProfileBasicRow | ContactPointRow | ContactAddressRow
function isContactPointRow(row: Row): row is ContactPointRow {
  return 'value' in row
}

function isAddressRow(row: Row): row is ContactAddressRow {
  return 'streetAddress' in row
}

function isProfileBasicRow(row: Row): row is ProfileBasicRow {
  return 'name' in row
}


function rowHasContent(row: Row): boolean {
  if (isContactPointRow(row)) {
    return hasNonEmptyText(row.value)
  }
  if (isAddressRow(row)) {
    return [
      row.streetAddress,
      row.locality,
      row.region,
      row.postalCode,
      row.countryName
    ].some(hasNonEmptyText)
  }
  if (isProfileBasicRow(row)) {
    return [
      row.name,
      row.nickname,
      row.imageSrc,
      row.location,
      row.pronouns,
      row.dateOfBirth,
      row.jobTitle,
      row.orgName
    ].some(hasNonEmptyText)
  }
  return false
}

function normalizePronounsValue(value: string | undefined): string {
  const normalized = sanitizeTextValue(value || '').toLowerCase().replace(/\s+/g, '')
  if (!normalized) return ''
  if (normalized === 'he' || normalized === 'he/him') return 'He/Him'
  if (normalized === 'she' || normalized === 'she/her') return 'She/Her'
  if (normalized === 'they' || normalized === 'they/them') return 'They/Them'
  return value || ''
}

function toFormState(profileData: ProfileDetails): HeadingFormState {
  const basicInfo: ProfileBasicRow = {
    name: sanitizeTextValue(toText(profileData.name)),
    nickname: sanitizeTextValue(toText(profileData.nickname || '')),
    imageSrc: sanitizeTextValue(toText(profileData.imageSrc || '')),
    location: sanitizeTextValue(toText(profileData.location || '')),
    pronouns: normalizePronounsValue(toText(profileData.pronouns || '')),
    dateOfBirth: sanitizeTextValue(toText(profileData.dateOfBirth || '')),
    jobTitle: sanitizeTextValue(toText(profileData.jobTitle || '')),
    orgName: sanitizeTextValue(toText(profileData.orgName || '')),
    entryNode: toText(profileData.entryNode),
    status: toText(profileData.entryNode) ? 'existing' as const : 'new' as const
  }
  const primaryEmail = profileData.primaryEmail
  const primaryPhone = profileData.primaryPhone
  const primaryAddress = profileData.primaryAddress

  const email: ContactPointRow = {
    value: sanitizeEmailValue(toText(primaryEmail?.valueNode).replace(/^mailto:/i, '')),
    type: toTypeLabel(primaryEmail?.type),
    entryNode: toText(primaryEmail?.entryNode),
    status: toText(primaryEmail?.entryNode) ? 'existing' as const : 'new' as const
  }
  const phone: ContactPointRow = {
      value: sanitizeTextValue(
        toText(primaryPhone?.valueNode || primaryPhone?.entryNode || '').replace(/^tel:/i, '')
      ),
      type: toTypeLabel(primaryPhone?.type),
      entryNode: toText(primaryPhone?.entryNode || ''),
      status: toText(primaryPhone?.entryNode || '') ? 'existing' as const : 'new' as const
  }
  const address: ContactAddressRow = {
      streetAddress: sanitizeAddressFieldValue(toText(primaryAddress?.streetAddress)),
      locality: sanitizeAddressFieldValue(toText(primaryAddress?.locality)),
      region: sanitizeAddressFieldValue(toText(primaryAddress?.region)),
      postalCode: sanitizeAddressFieldValue(toText(primaryAddress?.postalCode)),
      countryName: sanitizeAddressFieldValue(toText(primaryAddress?.countryName)),
      type: toTypeLabel(primaryAddress?.type),
      entryNode: toText(primaryAddress?.entryNode),
      status: toText(primaryAddress?.entryNode) ? 'existing' as const : 'new' as const
  }

  return {
      basicInfo: (basicInfo) ? basicInfo : { name: '', nickname: '', imageSrc: '', location: '', pronouns: '', dateOfBirth: '', jobTitle: '', orgName: '', entryNode: '', status: 'new' },
      email: (email) ? email : { value: '', type: '', entryNode: '', status: 'new' },
      phone: (phone) ? phone : { value: '', type: '', entryNode: '', status: 'new' },
      address: (address) ? address : { streetAddress: '', locality: '', region: '', postalCode: '', countryName: '', type: '', entryNode: '', status: 'new' }
    }
}

type ProfileBasicEditableField =
  | 'name'
  | 'nickname'
  | 'imageSrc'
  | 'pronouns'
  | 'dateOfBirth'
  | 'jobTitle'
  | 'orgName'

type ContactAddressEditableField =
  | 'streetAddress'
  | 'locality'
  | 'region'
  | 'postalCode'
  | 'countryName'

type ContactPhoneInputRowProps = {
  phone: ContactPointRow
}

type ContactEmailInputRowProps = {
  email: ContactPointRow
}

type ContactAddressInputRowProps = {
  address: ContactAddressRow
}

/* Will use later function renderCountryPrefixSelect(
  name: string,
  value: string,
  label: string,
  onChange: (event: Event) => void
) {
  return html`
    <label class="label phonePrefixField" aria-label=${label}>
      <select class="phonePrefixSelect" name=${name} .value=${value} @change=${onChange}>
        ${COUNTRY_PREFIX_OPTIONS.map((option) => html`
          <option value=${option.dialCode}>
            ${countryCodeToFlag(option.iso2)} ${option.dialCode}
          </option>
        `)}
      </select>
    </label>
  `
} */

function renderContactPhoneInput({
  phone
}: ContactPhoneInputRowProps) {
  const label = 'Phone Number'
  /* const countryCodeLabel = 'Country Calling Code' */
  /* const prefixInputName = 'phone-prefix' */
  const typeLabel = 'Phone Type'
  const inputName = 'phone-value'
  const typeInputName = 'phone-type'
  const splitValue = splitPhoneValue(phone?.value || '')
  let selectedDialCode = splitValue.dialCode

  const handleValueInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizePhoneLocalValue(target.value)
    if (phone) {
      applyRowFieldChange(phone, 'value', combinePhoneValue(selectedDialCode, nextValue), rowHasContent)
    }
  }
 /* Leaving here for when we add country code back in
  const handleCountryCodeInput = (e: Event) => {
    const target = e.target as HTMLSelectElement
    selectedDialCode = target.value

    if (phone) {
      const localNumber = splitPhoneValue(phone.value).localNumber
      applyRowFieldChange(phone, 'value', combinePhoneValue(selectedDialCode, localNumber), rowHasContent)
    }
  } */

  const handleTypeInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (phone) {
      applyRowSelectChange(phone, 'type', nextType)
    }
  }

  return html`
    <div class="profile-edit-dialog__row">
      <div class="profile-edit-dialog__field profile-edit-dialog__field--full">
        <label aria-label=${label} class="label">
          <input
            class="input"
            type="tel"
            name=${inputName}
            .value=${splitValue.localNumber}
            required
            data-contact-field="value"
            data-entry-node=${phone?.entryNode || ''}
            data-row-status=${phone?.status || 'n/a'}
            placeholder="Phone Number"
            autocomplete="tel-national"
            inputmode="tel"
            @input=${handleValueInput}
          />
        </label>
      </div>
      <label aria-label=${typeLabel} class="label profile-edit-dialog__field-type profile-edit-dialog__field-type--contact-point">
        <select class="input" name=${typeInputName} id="phone-type-select-${inputName}" @change=${handleTypeInput} .value=${phone?.type || ''}>
          <option value="Mobile">Mobile</option>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
        </select>
      </label>
    </div>
  `
}

function renderContactEmailInputRow({
  email
}: ContactEmailInputRowProps) {
  const label = 'Email Address'
  const typeLabel = 'Email Type'
  const inputName = 'email-value'
  const typeInputName = 'email-type'

  const handleValueInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeEmailValue(target.value)
    if (email) {
      applyRowFieldChange(email, 'value', nextValue, rowHasContent)
    }
  }

  const handleTypeInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (email) {
      applyRowSelectChange(email, 'type', nextType)
    }
  }

  return html`
    <div class="profile-edit-dialog__row">
      <label aria-label=${label} class="label profile-edit-dialog__field profile-edit-dialog__field--full">
        <input
          class="input"
          type="email"
          name=${inputName}
          .value=${email?.value || ''}
          required
          data-contact-field="value"
          data-entry-node=${email?.entryNode || ''}
          data-row-status=${email?.status || 'n/a'}
          placeholder="Email Address"
          autocomplete="email"
          inputmode="email"
          @input=${handleValueInput}
        />
      </label>
      <label aria-label=${typeLabel} class="label profile-edit-dialog__field-type profile-edit-dialog__field-type--contact-point">
        <select class="input" name=${typeInputName} id="email-type-select-${inputName}" @change=${handleTypeInput} .value=${email?.type || ''}>
          <option value="Home">Personal</option>
          <option value="Office">Office</option>
        </select>
      </label>
    </div>
  `
}

function renderContactAddressInput({
  address
}: ContactAddressInputRowProps) {
  const label = 'Address'
  /* const typeLabel = 'Address Type' */
  /* const typeInputName = 'address-type' */
  /* const addressTypeSelectId = 'address-type-select' */
  const streetAddressName = 'address-street'
  const localityName = 'address-locality'
  const regionName = 'address-region'
  const postalCodeName = 'address-postal'
  const countryName = 'address-country'


  const handleAddressInput = (field: ContactAddressEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeAddressFieldValue(target.value)
    if (address) {
      applyRowFieldChange(address, field, nextValue, rowHasContent)
    }
  }

  /* const handleTypeInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextType = target.value
    if (address) {
      applyRowSelectChange(address, 'type', nextType)
    } 
  } */

  return html`
    <label aria-label=${`${label} Street`} class="label profile-edit-dialog__field profile-edit-dialog__field--rowWidth">
      Street Address
      <input
        class="input"
        type="text"
        name=${streetAddressName}
        .value=${address?.streetAddress || ''}
        required
        data-contact-field="streetAddress"
        data-entry-node=${address?.entryNode || ''}
        data-row-status=${address?.status || 'n/a'}
        placeholder="Street Address"
        autocomplete="street-address"
        inputmode="text"
        @change=${handleAddressInput('streetAddress')}
      />
    </label>

    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Locality`} class="label profile-edit-dialog__field">
        Locality
        <input
          class="input"
          type="text"
          name=${localityName}
          .value=${address?.locality || ''}
          data-contact-field="locality"
          data-entry-node=${address?.entryNode || ''}
          data-row-status=${address?.status || 'n/a'}
          placeholder="City / Locality"
          autocomplete="address-level2"
          inputmode="text"
          @change=${handleAddressInput('locality')}
        />
      </label>
      <label aria-label=${`${label} Postal Code`} class="label profile-edit-dialog__field">
        Postal Code
        <input
          class="input"
          type="text"
          name=${postalCodeName}
          .value=${address?.postalCode || ''}
          data-contact-field="postalCode"
          data-entry-node=${address?.entryNode || ''}
          data-row-status=${address?.status || 'n/a'}
          placeholder="Postal Code"
          autocomplete="postal-code"
          inputmode="text"
          @change=${handleAddressInput('postalCode')}
        />
      </label>
    </div>

    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Region`} class="label profile-edit-dialog__field">
        Region
        <input
          class="input"
          type="text"
          name=${regionName}
          .value=${address?.region || ''}
          data-contact-field="region"
          data-entry-node=${address?.entryNode || ''}
          data-row-status=${address?.status || 'n/a'}
          placeholder="State / Region"
          autocomplete="address-level1"
          inputmode="text"
          @change=${handleAddressInput('region')}
        />
      </label>
      <label aria-label=${`${label} Country`} class="label profile-edit-dialog__field">
        Country
        <input
          class="input"
          type="text"
          name=${countryName}
          .value=${address?.countryName || ''}
          data-contact-field="countryName"
          data-entry-node=${address?.entryNode || ''}
          data-row-status=${address?.status || 'n/a'}
          placeholder="Country"
          autocomplete="country-name"
          inputmode="text"
          @change=${handleAddressInput('countryName')}
        />
      </label>
    </div>
  `
}

function renderHeadingInfoInput(
  basicInfo: ProfileBasicRow,
  phone: ContactPointRow,
  email: ContactPointRow
): TemplateResult {
  const imageSrcLabel = 'Profile Photo'
  const recommendedImageToLoad = 'Recommended: Square JPG, PNG. Max 2MB.'
  const nameLabel = 'Full Name'
  const nicknameLabel = 'Nickname'
  const pronounsLabel = 'Pronouns'
  const dateOfBirthLabel = 'DOB'
  const jobTitleLabel = 'Job Title'
  const orgNameLabel = 'Organization Name'

  const handleBasicInfoInput = (field: ProfileBasicEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeBasicInputFieldValue(target.value)
    if (basicInfo) {
      applyRowFieldChange(basicInfo, field, nextValue, rowHasContent)
    }
  }

  const handleDateOfBirthInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeBasicInputFieldValue(target.value)
    if (basicInfo) {
      applyRowFieldChange(basicInfo, 'dateOfBirth', toStorageDateISO(nextValue), rowHasContent)
    }
  }
   const handlePronounsInput = (e: Event) => {
    const target = e.target as HTMLSelectElement
    const nextType = target.value
    if (basicInfo) {
      applyRowSelectChange(basicInfo, 'pronouns', nextType)
    }
  }

  // Need to write the logic for uploading an image and getting the URL to update the 
  // imageSrc field, for now just clearing the field to trigger a change and let user 
  // input the URL manually if they want to upload an image.
  const handleUpload = (field: ProfileBasicEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeBasicInputFieldValue(target.value)
    if (basicInfo) {
      applyRowFieldChange(basicInfo, field, nextValue, rowHasContent)
    }
  }

    // Need to write the logic for deleting an image and getting the URL to update the 
  // imageSrc field, for now just clearing the field to trigger a change and let user 
  // input the URL manually if they want to upload an image.
  const handleDelete = (field: ProfileBasicEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeBasicInputFieldValue(target.value)
    if (basicInfo) {
      applyRowFieldChange(basicInfo, field, nextValue, rowHasContent)
    }
  }

  return html`
    <div class="profile-edit-dialog__row">
      <header class="mb-md" aria-label="Profile Image">
        ${Image(basicInfo.imageSrc, basicInfo.name)}
      </header>

      <div class="profile-edit-dialog__image-preview" aria-label="Profile Photo Preview">
        <p class="profile-edit-dialog__image-preview-label"><strong>${imageSrcLabel}</strong></p>
        <p class="profile-edit-dialog__image-preview-description">${recommendedImageToLoad}</p>

        <div class="profile-edit-dialog__image-preview-actions">
          <button
            type="button"
            class="profile-edit-dialog__image-upload-button"
            aria-label="Upload new profile photo"
            title="Upload New"
            @click=${handleUpload('imageSrc')}
          >
            Upload New
          </button>
          <button
            type="button"
            class="profile-edit-dialog__image-remove-button"
            aria-label="Delete profile photo"
            title="Remove"
            @click=${handleDelete('imageSrc')}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
    <div class="profile-edit flex-column gap-lg">
      <div class="profile-edit-dialog__row profile-edit-dialog__row--equal">
        <label aria-label=${nameLabel} class="label profile-edit-dialog__field">
          ${nameLabel}
          <input
            class="input"
            type="text"
            name="name"
            .value=${basicInfo?.name || ''}
            required
            data-contact-field="name"
            data-entry-node=${basicInfo?.entryNode || ''}
            data-row-status=${basicInfo?.status || 'n/a'}
            placeholder="Full Name"
            autocomplete="name"
            inputmode="text"
            @change=${handleBasicInfoInput('name')}
          />
        </label>
        <label aria-label=${nicknameLabel} class="label profile-edit-dialog__field">
          ${nicknameLabel}
          <input
            class="input"
            type="text"
            name="nickname"
            .value=${basicInfo?.nickname || ''}
            data-contact-field="nickname"
            data-entry-node=${basicInfo?.entryNode || ''}
            data-row-status=${basicInfo?.status || 'n/a'}
            placeholder="Nickname"
            autocomplete="nickname"
            inputmode="text"
            @change=${handleBasicInfoInput('nickname')}
          />
        </label>
      </div>
      <div class="profile-edit-dialog__row profile-edit-dialog__row--equal">
        <label aria-label=${pronounsLabel} class="label profile-edit-dialog__field-type profile-edit-dialog__field--stack">
          ${pronounsLabel}
          <select class="input" name="pronouns" @change=${handlePronounsInput} .value=${basicInfo?.pronouns || ''}>
            <option value="He/Him">He/Him</option>
            <option value="She/Her">She/Her</option>
            <option value="They/Them">They/Them</option>
          </select>
        </label>
        <label aria-label=${dateOfBirthLabel} class="label profile-edit-dialog__field">
          ${dateOfBirthLabel}
          <input
            class="input"
            type="date"
            name="profile-date-of-birth"
            .value=${toStorageDateISO(basicInfo?.dateOfBirth)}
            data-contact-field="dateOfBirth"
            data-entry-node=${basicInfo?.entryNode || ''}
            data-row-status=${basicInfo?.status || 'n/a'}
            autocomplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            @change=${handleDateOfBirthInput}
          />
        </label>
      </div>
      <div class="profile-edit-dialog__row profile-edit-dialog__row--equal">
        <label aria-label=${jobTitleLabel} class="label profile-edit-dialog__field">
          ${jobTitleLabel}
          <input
            class="input"
            type="text"
            name="jobTitle"
            .value=${basicInfo?.jobTitle || ''}
            data-contact-field="jobTitle"
            data-entry-node=${basicInfo?.entryNode || ''}
            data-row-status=${basicInfo?.status || 'n/a'}
            placeholder="Job Title"
            autocomplete="organization-title"
            inputmode="text"
            @change=${handleBasicInfoInput('jobTitle')}
          />
        </label>
        <label aria-label=${orgNameLabel} class="label profile-edit-dialog__field">
          ${orgNameLabel}
          <input
            class="input"
            type="text"
            name="orgName"
            .value=${basicInfo?.orgName || ''}
            data-contact-field="orgName"
            data-entry-node=${basicInfo?.entryNode || ''}
            data-row-status=${basicInfo?.status || 'n/a'}
            placeholder="Organization Name"
            autocomplete="organization-name"
            inputmode="text"
            @change=${handleBasicInfoInput('orgName')}
          />
        </label>
      </div>
      <div class="profile-edit-dialog__row profile-edit-dialog__row--equal">
        <div class="profile-edit-dialog__field profile-edit-dialog__field--full">
          ${renderContactPhoneInput({ phone })}
        </div>
        <div class="profile-edit-dialog__field profile-edit-dialog__field--full">
          ${renderContactEmailInputRow({ email })}
        </div>
      </div>
    </div>
  `
}

function renderHeadingEditTemplate(form: HTMLFormElement, formState: HeadingFormState) {
 
  render(html`
    ${renderHeadingInfoInput(formState.basicInfo, formState.phone, formState.email)}
    ${renderContactAddressInput({ address: formState.address })}
  `, form)
}

function createHeadingEditForm(profileData: ProfileDetails) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form', 'flex-column', 'gap-sm')
  form.autocomplete = 'off'
  form.setAttribute('data-lpignore', 'true')
  form.setAttribute('data-1p-ignore', 'true')
  form.setAttribute('data-bwignore', 'true')

  const formState = toFormState(profileData)
  renderHeadingEditTemplate(form, formState)

  return { form, formState }
}

function validateHeadingDataBeforeSave(formState: HeadingFormState): string | null {
  const basicInfoOps = summarizeRowOps([formState.basicInfo], rowHasContent)
  const phoneOps = summarizeRowOps([formState.phone], rowHasContent)
  const emailOps = summarizeRowOps([formState.email], rowHasContent)
  const addressOps = summarizeRowOps([formState.address], rowHasContent)
  const hasChanges =
    basicInfoOps.create.length > 0 || basicInfoOps.update.length > 0 || basicInfoOps.remove.length > 0 ||
    phoneOps.create.length > 0 || phoneOps.update.length > 0 || phoneOps.remove.length > 0 ||
    emailOps.create.length > 0 || emailOps.update.length > 0 || emailOps.remove.length > 0 ||
    addressOps.create.length > 0 || addressOps.update.length > 0 || addressOps.remove.length > 0

  if (!hasChanges) return 'No intro changes detected.'
  return null
}


export async function createHeadingEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  profileData: ProfileDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = document
  const { form, formState } = createHeadingEditForm(profileData)

  const result = await openInputDialog({
    title: editHeadingDialogTitleText,
    dom,
    form,
    headerAction: { type: 'close' },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: () => {
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }
      return validateHeadingDataBeforeSave(formState)
    },
    onSave: async () => {
      const plan: HeadingMutationPlan = {
        basicOps: summarizeRowOps([formState.basicInfo], rowHasContent),
        phoneOps: summarizeRowOps([formState.phone], rowHasContent),
        emailOps: summarizeRowOps([formState.email], rowHasContent),
        addressOps: summarizeRowOps([formState.address], rowHasContent)
      }
      await processHeadingMutations(store, subject, plan)
    },
    formatSaveError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      return `${saveHeadingUpdatesFailedPrefixText} ${message}`
    }
  })

  if (!result) return

  if (onSaved) {
    await onSaved()
  }
}
