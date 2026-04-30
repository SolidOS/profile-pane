import { openInputDialog } from '../../ui/dialog'
import { html, render, TemplateResult } from 'lit-html'
import 'solid-ui/components/select'
import 'solid-ui/components/photo-capture'
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
import {
  normalizeEmailTypeForEdit,
  normalizePhoneTypeForEdit,
  toSavedHeadingEmailType,
  toSavedHeadingPhoneType
} from '../shared/contactTypeUtils'
import { applyRowFieldChange, applyRowSelectChange, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText, toTypeLabel } from '../../textUtils'
import {
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editHeadingDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveHeadingUpdatesFailedPrefixText
} from '../../texts'
import { cameraIcon } from '../../icons-svg/profileIcons'
import { ContactAddressRow, ContactPointRow } from '../contactInfo/types'
import { sanitizeAddressFieldValue, sanitizeBasicInputFieldValue, sanitizeEmailValue, sanitizePhoneLocalValue } from '../shared/sanitizeUtils'
import { toStorageDateISO } from './dateHelpers'
import { deletePhotoFile, uploadPhotoFile } from './imageHelpers'
/* Note: new design - has address type in More Edit Contacts for now we will leave
         out Address Type, but a ticket will be created to add type later
         so I will keep the code and just comment it out for now. 
         new design - has country code, will comment out code for now and create a ticket to add later. */

type HeadingPhotoCaptureElement = HTMLElement & {
  heading: string
  captureLabel: string
  confirmLabel: string
  retakeLabel: string
  cancelLabel: string
  presentation: 'inline' | 'dialog'
  showTrigger: boolean
  showCancelButton: boolean
  autoCloseOnCapture: boolean
  fileNamePrefix: string
  facingMode: string
  open: boolean
}

type HeadingPhotoCapturedDetail = {
  file: File
}

type HeadingFormState = {
  basicInfo: ProfileBasicRow
  email: ContactPointRow
  phone: ContactPointRow
  address: ContactAddressRow
}

type HeadingContactTypeOption = {
  label: string
  value: string
}

type HeadingPronounsOption = {
  label: string
  value: string
}

type HeadingContactTypeKind = 'phone' | 'email'

type HeadingContactTypeSelectElement = HTMLElement & {
  options?: HeadingContactTypeOption[]
  value?: string
  label?: string
}

type HeadingPronounsSelectElement = HTMLElement & {
  options?: HeadingPronounsOption[]
  value?: string
  label?: string
}

const HEADING_PHONE_TYPE_OPTIONS: HeadingContactTypeOption[] = [
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Home', value: 'Home' },
  { label: 'Work', value: 'Work' }
]

const HEADING_EMAIL_TYPE_OPTIONS: HeadingContactTypeOption[] = [
  { label: 'Personal', value: 'Personal' },
  { label: 'Office', value: 'Office' }
]

const HEADING_PRONOUN_OPTIONS: HeadingPronounsOption[] = [
  { label: 'He/Him', value: 'He/Him' },
  { label: 'She/Her', value: 'She/Her' },
  { label: 'They/Them', value: 'They/Them' }
]

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

function normalizeHeadingContactTypeValue(value: string, options: HeadingContactTypeOption[]): string {
  return options.some((option) => option.value === value) ? value : options[0]?.value || ''
}

function readHeadingContactTypeChange(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLSelectElement | HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function getHeadingContactTypeOptions(kind: HeadingContactTypeKind): HeadingContactTypeOption[] {
  return kind === 'phone' ? HEADING_PHONE_TYPE_OPTIONS : HEADING_EMAIL_TYPE_OPTIONS
}

function getHeadingContactTypeValue(
  kind: HeadingContactTypeKind,
  formState: HeadingFormState
): string {
  const row = kind === 'phone' ? formState.phone : formState.email
  return normalizeHeadingContactTypeValue(row?.type || '', getHeadingContactTypeOptions(kind))
}

function initializeHeadingContactTypeSelects(form: HTMLFormElement, formState: HeadingFormState): void {
  const selectElements = form.querySelectorAll('solid-ui-select[data-heading-contact-type-kind]') as NodeListOf<HeadingContactTypeSelectElement>

  selectElements.forEach((selectElement) => {
    const kind = selectElement.dataset.headingContactTypeKind as HeadingContactTypeKind | undefined
    if (!kind) return

    selectElement.options = getHeadingContactTypeOptions(kind)
    selectElement.value = getHeadingContactTypeValue(kind, formState)
    selectElement.label = ''
  })
}

function initializeHeadingPronounsSelect(form: HTMLFormElement, formState: HeadingFormState): void {
  const selectElement = form.querySelector('solid-ui-select[data-heading-basic-field="pronouns"]') as HeadingPronounsSelectElement | null
  if (!selectElement) return

  selectElement.options = HEADING_PRONOUN_OPTIONS
  selectElement.value = normalizePronounsValue(formState.basicInfo?.pronouns || '')
  selectElement.label = ''
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

  const normalizedEmailType = normalizeEmailTypeForEdit(primaryEmail?.type)
  const normalizedPhoneType = normalizePhoneTypeForEdit(primaryPhone?.type)

  const email: ContactPointRow = {
    value: sanitizeEmailValue(toText(primaryEmail?.valueNode).replace(/^mailto:/i, '')),
    type: normalizedEmailType,
    entryNode: toText(primaryEmail?.entryNode),
    status: toText(primaryEmail?.entryNode) ? 'existing' as const : 'new' as const
  }
  const phone: ContactPointRow = {
      value: sanitizeTextValue(
        toText(primaryPhone?.valueNode || primaryPhone?.entryNode || '').replace(/^tel:/i, '')
      ),
      type: normalizedPhoneType,
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

function mapEmailOpsForSave(ops: { create: ContactPointRow[], update: ContactPointRow[], remove: ContactPointRow[] }) {
  const mapRow = (row: ContactPointRow): ContactPointRow => ({
    ...row,
    type: toSavedHeadingEmailType(row.type)
  })

  return {
    create: ops.create.map(mapRow),
    update: ops.update.map(mapRow),
    remove: ops.remove.map(mapRow)
  }
}

function mapPhoneOpsForSave(ops: { create: ContactPointRow[], update: ContactPointRow[], remove: ContactPointRow[] }) {
  const mapRow = (row: ContactPointRow): ContactPointRow => ({
    ...row,
    type: toSavedHeadingPhoneType(row.type)
  })

  return {
    create: ops.create.map(mapRow),
    update: ops.update.map(mapRow),
    remove: ops.remove.map(mapRow)
  }
}

function renderContactPhoneInput({
  phone
}: ContactPhoneInputRowProps) {
  const label = 'Phone Number'
  const typeLabel = 'Phone Type'
  const inputName = 'phone-value'
  const splitValue = splitPhoneValue(phone?.value || '')
  let selectedDialCode = splitValue.dialCode

  const handleValueInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizePhoneLocalValue(target.value)
    if (phone) {
      applyRowFieldChange(phone, 'value', combinePhoneValue(selectedDialCode, nextValue), rowHasContent)
    }
  }

  const handleTypeInput = (e: Event) => {
    const nextType = readHeadingContactTypeChange(e)
    if (phone) {
      applyRowSelectChange(phone, 'type', nextType)
    }
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--equal profile-edit-dialog__row--contact-point">
      <div class="profile-edit-dialog__field">
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
        <solid-ui-select
          class="profile-edit-dialog__type-select"
          id=${`phone-type-select-${inputName}`}
          data-heading-contact-type-kind="phone"
          aria-label=${typeLabel}
          .label=${''}
          .options=${HEADING_PHONE_TYPE_OPTIONS}
          .value=${normalizeHeadingContactTypeValue(phone?.type || '', HEADING_PHONE_TYPE_OPTIONS)}
          @change=${handleTypeInput}
        ></solid-ui-select>
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

  const handleValueInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeEmailValue(target.value)
    if (email) {
      applyRowFieldChange(email, 'value', nextValue, rowHasContent)
    }
  }

  const handleTypeInput = (e: Event) => {
    const nextType = readHeadingContactTypeChange(e)
    if (email) {
      applyRowSelectChange(email, 'type', nextType)
    }
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--equal profile-edit-dialog__row--contact-point">
      <label aria-label=${label} class="label profile-edit-dialog__field">
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
        <solid-ui-select
          class="profile-edit-dialog__type-select"
          id=${`email-type-select-${inputName}`}
          data-heading-contact-type-kind="email"
          aria-label=${typeLabel}
          .label=${''}
          .options=${HEADING_EMAIL_TYPE_OPTIONS}
          .value=${normalizeHeadingContactTypeValue(email?.type || '', HEADING_EMAIL_TYPE_OPTIONS)}
          @change=${handleTypeInput}
        ></solid-ui-select>
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
    <label aria-label=${`${label} Street`} class="label profile-edit-dialog__field profile-edit-dialog__field--row-width">
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

    <div class="profile-edit-dialog__row profile-edit-dialog__row--equal profile-edit-dialog__row--full">
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

    <div class="profile-edit-dialog__row profile-edit-dialog__row--equal profile-edit-dialog__row--full">
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
  store: LiveStore,
  subject: NamedNode,
  basicInfo: ProfileBasicRow,
  phone: ContactPointRow,
  email: ContactPointRow,
  rerender: () => void
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
    const nextValue = normalizePronounsValue(readHeadingContactTypeChange(e))
    if (basicInfo) {
      applyRowSelectChange(basicInfo, 'pronouns', nextValue)
    }
  }

  const handleUpload = async (e: Event) => {
    const button = e.currentTarget as HTMLButtonElement | null
    const dom = button?.ownerDocument || document
    const fileInput = dom.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.hidden = true

    const cleanupFileInput = () => {
      fileInput.remove()
    }

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0]
      cleanupFileInput()
      if (!file || !basicInfo) return

      try {
        const uploadedUri = await uploadPhotoFile(store, subject, file)
        applyRowFieldChange(basicInfo, 'imageSrc', uploadedUri, rowHasContent)
        rerender()
      } catch (error) {
        console.error('Profile image upload failed', error)
      }
    }, { once: true })

    dom.body.appendChild(fileInput)
    fileInput.click()
  }

  const handleCameraClick = async (e: Event) => {
    e.preventDefault()
    const button = e.currentTarget as HTMLElement | null
    const headingPhotoRow = button?.closest('.profile-edit-dialog__row--heading-photo') as HTMLElement | null
    const hostRow = headingPhotoRow?.nextElementSibling as HTMLElement | null
    const frame = hostRow?.querySelector('.profile-edit-dialog__image-camera-capture-frame') as HTMLDivElement | null
    if (!frame || frame.dataset.active === 'true') return

    frame.hidden = false
    frame.dataset.active = 'true'
    frame.replaceChildren()

    const closeCameraFrame = () => {
      frame.replaceChildren()
      frame.hidden = true
      frame.dataset.active = 'false'
    }

    try {
      const photoCapture = document.createElement('solid-ui-photo-capture') as HeadingPhotoCaptureElement
      photoCapture.classList.add('profile-edit-dialog__photo-capture')
      photoCapture.heading = ''
      photoCapture.captureLabel = 'Take Photo'
      photoCapture.confirmLabel = 'Use Photo'
      photoCapture.retakeLabel = 'Retake'
      photoCapture.cancelLabel = 'Close camera'
      photoCapture.presentation = 'inline'
      photoCapture.showTrigger = false
      photoCapture.showCancelButton = true
      photoCapture.autoCloseOnCapture = false
      photoCapture.fileNamePrefix = 'camera'
      photoCapture.facingMode = 'environment'
      photoCapture.open = true

      photoCapture.addEventListener('cancel', () => {
        closeCameraFrame()
      })

      photoCapture.addEventListener('photo-captured', async (event: Event) => {
        const detail = (event as CustomEvent<HeadingPhotoCapturedDetail>).detail
        if (!detail?.file || !basicInfo) return

        try {
          const uploadedUri = await uploadPhotoFile(store, subject, detail.file)
          closeCameraFrame()
          applyRowFieldChange(basicInfo, 'imageSrc', uploadedUri, rowHasContent)
          rerender()
        } catch (error) {
          console.error('Profile camera upload failed', error)
        }
      })

      frame.appendChild(photoCapture)
    } catch (error) {
      closeCameraFrame()
      console.error('Camera control failed to initialize', error)
    }
  }

  const handleDelete = async (_e: Event) => {
    if (!basicInfo) return
    applyRowFieldChange(basicInfo, 'imageSrc', '', rowHasContent)
    rerender()
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--heading-photo">
      <header class="mb-md" aria-label="Profile Image">
        <div class="profile-edit-dialog__image-frame">
          ${Image(basicInfo.imageSrc, basicInfo.name)}
          <button
            type="button"
            class="profile-edit-dialog__image-camera-button flex-center"
            aria-label="Take a photo"
            title="Take a photo"
            @click=${handleCameraClick}
          >
            ${cameraIcon}
          </button>
        </div>
      </header>

      <div class="profile-edit-dialog__image-preview" aria-label="Profile Photo Preview">
        <p class="profile-edit-dialog__image-preview-label"><strong>${imageSrcLabel}</strong></p>
        <p class="profile-edit-dialog__image-preview-description">${recommendedImageToLoad}</p>

        <div class="profile-edit-dialog__image-preview-actions">
          <button
            type="button"
            class="profile-edit-dialog__image-button profile-edit-dialog__image-upload-button flex-center"
            aria-label="Upload new profile photo"
            title="Upload New"
            @click=${handleUpload}
          >
            Upload New
          </button>
          <button
            type="button"
            class="profile-edit-dialog__image-button profile-edit-dialog__image-remove-button flex-center"
            aria-label="Delete profile photo"
            title="Remove"
            @click=${handleDelete}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
    <div class="profile-edit-dialog__image-camera-capture-row">
      <div class="profile-edit-dialog__image-camera-capture-frame" hidden></div>
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
          <solid-ui-select
            class="profile-edit-dialog__type-select"
            id="heading-pronouns-select"
            name="pronouns"
            data-heading-basic-field="pronouns"
            aria-label=${pronounsLabel}
            .label=${''}
            .options=${HEADING_PRONOUN_OPTIONS}
            .value=${normalizePronounsValue(basicInfo?.pronouns || '')}
            @change=${handlePronounsInput}
          ></solid-ui-select>
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

function renderHeadingEditTemplate(
  form: HTMLFormElement,
  formState: HeadingFormState,
  store: LiveStore,
  subject: NamedNode,
  viewerMode: ViewerMode
) {
  const rerender = () => renderHeadingEditTemplate(form, formState, store, subject, viewerMode)
 
  render(html`
    ${renderHeadingInfoInput(store, subject, formState.basicInfo, formState.phone, formState.email, rerender)}
    ${renderContactAddressInput({ address: formState.address })}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)

  initializeHeadingContactTypeSelects(form, formState)
  initializeHeadingPronounsSelect(form, formState)
}

function createHeadingEditForm(
  store: LiveStore,
  subject: NamedNode,
  profileData: ProfileDetails,
  viewerMode: ViewerMode
) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form', 'profile-edit-dialog--heading', 'flex-column', 'gap-sm')
  form.autocomplete = 'off'
  form.setAttribute('data-lpignore', 'true')
  form.setAttribute('data-1p-ignore', 'true')
  form.setAttribute('data-bwignore', 'true')

  const formState = toFormState(profileData)
  renderHeadingEditTemplate(form, formState, store, subject, viewerMode)

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
  const originalPhotoUri = sanitizeTextValue(toText(profileData.imageSrc || ''))
  const { form, formState } = createHeadingEditForm(store, subject, profileData, viewerMode)

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
      const phoneOps = summarizeRowOps([formState.phone], rowHasContent)
      const emailOps = summarizeRowOps([formState.email], rowHasContent)
      const plan: HeadingMutationPlan = {
        basicOps: summarizeRowOps([formState.basicInfo], rowHasContent),
        phoneOps: mapPhoneOpsForSave(phoneOps),
        emailOps: mapEmailOpsForSave(emailOps),
        addressOps: summarizeRowOps([formState.address], rowHasContent)
      }
      await processHeadingMutations(store, subject, plan)

      const nextPhotoUri = sanitizeTextValue(formState.basicInfo.imageSrc || '')
      if (originalPhotoUri && originalPhotoUri !== nextPhotoUri) {
        try {
          await deletePhotoFile(store, subject, originalPhotoUri)
        } catch (error) {
          console.warn('Profile image file delete failed', error)
        }
      }
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
