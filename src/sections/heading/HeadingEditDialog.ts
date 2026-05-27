import { openInputDialog } from '../../ui/dialog'
import { html, render, TemplateResult } from 'lit-html'
import 'solid-ui/components/actions/button'
import 'solid-ui/components/forms/select'
import 'solid-ui/components/media/photo-capture'
import { ProfileDetails, HeadingMutationPlan, ProfileBasicRow } from './types'
import { Image } from './Image'
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
  saveHeadingUpdatesFailedMessageText
} from '../../texts'
import { error as debugError } from '../../utils/debug'
import { cameraIcon } from '../../icons-svg/profileIcons'
import { ContactAddressRow, ContactPointRow } from '../contactInfo/types'
import { sanitizeAddressFieldValue, sanitizeBasicInputFieldValue, sanitizeEmailValue, sanitizePhoneLocalValue } from '../shared/sanitizeUtils'
import { toStorageDateISO } from './dateHelpers'
import { copyPhotoToProfileContainer, moveProfileImagesToPhotoContainer, resolvePhotoDisplaySrc, shouldStorePhotoInProfileContainer, uploadPhotoFile } from './imageHelpers'
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
  emailTypeWasMissing: boolean
  phoneTypeWasMissing: boolean
  imagePreviewSrc: string
  pendingPhotoFile: File | null
  clearImagePreview: () => void
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

function withDefaultHeadingContactType(
  row: ContactPointRow,
  kind: HeadingContactTypeKind
): ContactPointRow {
  return {
    ...row,
    type: normalizeHeadingContactTypeValue(row.type || '', getHeadingContactTypeOptions(kind))
  }
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
      row.dateOfBirth
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
    entryNode: toText(profileData.entryNode),
    status: toText(profileData.entryNode) ? 'existing' as const : 'new' as const
  }
  const primaryEmail = profileData.primaryEmail
  const primaryPhone = profileData.primaryPhone
  const primaryAddress = profileData.primaryAddress
  const emailTypeWasMissing = !normalizeEmailTypeForEdit(primaryEmail?.type)
  const phoneTypeWasMissing = !normalizePhoneTypeForEdit(primaryPhone?.type)

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
      basicInfo: (basicInfo) ? basicInfo : { name: '', nickname: '', imageSrc: '', location: '', pronouns: '', dateOfBirth: '', entryNode: '', status: 'new' },
      email: (email) ? email : { value: '', type: '', entryNode: '', status: 'new' },
      phone: (phone) ? phone : { value: '', type: '', entryNode: '', status: 'new' },
      address: (address) ? address : { streetAddress: '', locality: '', region: '', postalCode: '', countryName: '', type: '', entryNode: '', status: 'new' },
      emailTypeWasMissing,
      phoneTypeWasMissing,
      imagePreviewSrc: '',
      pendingPhotoFile: null,
      clearImagePreview: () => undefined
    }
}

function setHeadingImagePreview(formState: HeadingFormState, file: File) {
  formState.clearImagePreview()

  if (typeof URL.createObjectURL !== 'function') {
    formState.imagePreviewSrc = ''
    formState.clearImagePreview = () => undefined
    return
  }

  const previewUrl = URL.createObjectURL(file)
  formState.imagePreviewSrc = previewUrl
  formState.clearImagePreview = () => {
    URL.revokeObjectURL(previewUrl)
    formState.imagePreviewSrc = ''
    formState.clearImagePreview = () => undefined
  }
}

function setResolvedHeadingPreview(formState: HeadingFormState, resolvedImageSrc?: string) {
  formState.clearImagePreview()

  if (!resolvedImageSrc) {
    return
  }

  formState.imagePreviewSrc = resolvedImageSrc

  formState.clearImagePreview = () => {
    formState.imagePreviewSrc = ''
    formState.clearImagePreview = () => undefined
  }
}

type ProfileBasicEditableField =
  | 'name'
  | 'nickname'
  | 'imageSrc'
  | 'pronouns'
  | 'dateOfBirth'

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
    ...withDefaultHeadingContactType(row, 'email'),
    type: toSavedHeadingEmailType(withDefaultHeadingContactType(row, 'email').type)
  })

  return {
    create: ops.create.map(mapRow),
    update: ops.update.map(mapRow),
    remove: ops.remove.map(mapRow)
  }
}

function mapPhoneOpsForSave(ops: { create: ContactPointRow[], update: ContactPointRow[], remove: ContactPointRow[] }) {
  const mapRow = (row: ContactPointRow): ContactPointRow => ({
    ...withDefaultHeadingContactType(row, 'phone'),
    type: toSavedHeadingPhoneType(withDefaultHeadingContactType(row, 'phone').type)
  })

  return {
    create: ops.create.map(mapRow),
    update: ops.update.map(mapRow),
    remove: ops.remove.map(mapRow)
  }
}

function summarizeHeadingContactOps(
  row: ContactPointRow,
  kind: HeadingContactTypeKind,
  typeWasMissing: boolean
) {
  const ops = summarizeRowOps([row], rowHasContent)

  if (
    typeWasMissing &&
    row.entryNode &&
    row.status === 'existing' &&
    rowHasContent(row) &&
    ops.create.length === 0 &&
    ops.update.length === 0 &&
    ops.remove.length === 0
  ) {
    return {
      create: ops.create,
      update: [withDefaultHeadingContactType({ ...row, status: 'modified' }, kind)],
      remove: ops.remove
    }
  }

  return ops
}

function renderContactPhoneInput({
  phone
}: ContactPhoneInputRowProps) {
  const label = 'Phone Number 1'
  const typeLabel = 'Phone Type 1'
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
            placeholder=${label}
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
  formState: HeadingFormState,
  rerender: () => void
): TemplateResult {
  const { basicInfo, phone, email, imagePreviewSrc } = formState
  const imageSrcLabel = 'Profile Photo'
  const recommendedImageToLoad = 'Recommended: Square JPG, PNG. Max 2MB.'
  const nameLabel = 'Full Name'
  const nicknameLabel = 'Nickname'
  const pronounsLabel = 'Pronouns'
  const dateOfBirthLabel = 'DOB'

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
        formState.pendingPhotoFile = file
        setHeadingImagePreview(formState, file)
        applyRowFieldChange(
          basicInfo,
          'imageSrc',
          `pending-photo://${encodeURIComponent(file.name || 'image')}`,
          rowHasContent
        )
        rerender()
      } catch (error) {
        debugError('Profile image upload failed', error)
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
      photoCapture.facingMode = 'user'
      photoCapture.open = true

      photoCapture.addEventListener('cancel', (event) => {
        event.preventDefault()
        event.stopPropagation()
        closeCameraFrame()
      })

      photoCapture.addEventListener('photo-captured', async (event: Event) => {
        const detail = (event as CustomEvent<HeadingPhotoCapturedDetail>).detail
        if (!detail?.file || !basicInfo) return

        try {
          formState.pendingPhotoFile = detail.file
          closeCameraFrame()
          setHeadingImagePreview(formState, detail.file)
          applyRowFieldChange(
            basicInfo,
            'imageSrc',
            `pending-photo://${encodeURIComponent(detail.file.name || 'camera-image')}`,
            rowHasContent
          )
          rerender()
        } catch (error) {
          debugError('Profile camera upload failed', error)
        }
      })

      frame.appendChild(photoCapture)
    } catch (error) {
      closeCameraFrame()
      debugError('Camera control failed to initialize', error)
    }
  }

  const handleDelete = async (_e: Event) => {
    if (!basicInfo) return
    formState.pendingPhotoFile = null
    formState.clearImagePreview()
    applyRowFieldChange(basicInfo, 'imageSrc', '', rowHasContent)
    rerender()
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--heading-photo">
      <header class="profile-edit-dialog__image-preview-header" aria-label="Profile Image">
        <div class="profile-edit-dialog__image-frame">
          ${Image(imagePreviewSrc || basicInfo.imageSrc, basicInfo.name)}
          <solid-ui-button
            type="button"
            class="profile-edit-dialog__image-camera-button"
            variant="icon"
            size="md"
            aria-label="Take a photo"
            title="Take a photo"
            @click=${handleCameraClick}
          >
            <span slot="icon" aria-hidden="true">${cameraIcon}</span>
          </solid-ui-button>
        </div>
      </header>

      <div class="profile-edit-dialog__image-preview" aria-label="Profile Photo Preview">
        <p class="profile-edit-dialog__image-preview-label"><strong>${imageSrcLabel}</strong></p>
        <p class="profile-edit-dialog__image-preview-description">${recommendedImageToLoad}</p>

        <div class="profile-edit-dialog__image-preview-actions">
          <solid-ui-button
            type="button"
            variant="secondary"
            size="md"
            label="Upload New"
            class="profile-edit-dialog__image-button profile-edit-dialog__image-upload-button"
            aria-label="Upload new profile photo"
            title="Upload New"
            @click=${handleUpload}
          >
            Upload New
          </solid-ui-button>
          <solid-ui-button
            type="button"
            variant="secondary"
            size="md"
            label="Remove"
            class="profile-edit-dialog__image-button profile-edit-dialog__image-remove-button"
            aria-label="Delete profile photo"
            title="Remove"
            @click=${handleDelete}
          >
            Remove
          </solid-ui-button>
        </div>
      </div>
    </div>
    <div class="profile-edit-dialog__image-camera-capture-row">
      <div class="profile-edit-dialog__image-camera-capture-frame" hidden></div>
    </div>
    <div class="profile-edit">
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
      <div class="profile-edit-dialog__row profile-edit-dialog__row--equal profile-edit-dialog__row--heading-dob">
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
        <label aria-label=${dateOfBirthLabel} class="label profile-edit-dialog__field profile-edit-dialog__field--dob">
          ${dateOfBirthLabel}
          <input
            class="input profile-edit-dialog__input--dob"
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
    ${renderHeadingInfoInput(store, subject, formState, rerender)}
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
  form.classList.add('profile__edit-form', 'profile__edit-form--heading', 'profile-edit-dialog--heading')
  form.autocomplete = 'off'
  form.setAttribute('data-lpignore', 'true')
  form.setAttribute('data-1p-ignore', 'true')
  form.setAttribute('data-bwignore', 'true')

  const formState = toFormState(profileData)
  renderHeadingEditTemplate(form, formState, store, subject, viewerMode)

  return { form, formState }
}

function isValidHeadingEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidHeadingPhoneNumber(value: string): boolean {
  return /^\d+$/.test(value)
}

function validateHeadingDataBeforeSave(formState: HeadingFormState): string | null {
  const { localNumber } = splitPhoneValue(formState.phone?.value || '')
  if (rowHasContent(formState.phone) && !isValidHeadingPhoneNumber(localNumber)) {
    return 'Phone Number 1 should contain only numbers.'
  }

  if (rowHasContent(formState.email) && !isValidHeadingEmailAddress(formState.email?.value || '')) {
    return 'Email address must be a valid email address.'
  }

  return null
}


export async function createHeadingEditDialog(
  _event: Event,
  store: LiveStore,
  subject: NamedNode,
  profileData: ProfileDetails,
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = document
  const { form, formState } = createHeadingEditForm(store, subject, profileData, viewerMode)

  if (formState.basicInfo.imageSrc) {
    const resolvedImageSrc = await resolvePhotoDisplaySrc(store, formState.basicInfo.imageSrc)
    if (resolvedImageSrc && resolvedImageSrc !== formState.basicInfo.imageSrc) {
      setResolvedHeadingPreview(formState, resolvedImageSrc)
      renderHeadingEditTemplate(form, formState, store, subject, viewerMode)
    }
  }

  const hasPendingPhotoMigration = () => {
    const currentPhotoUri = sanitizeTextValue(formState.basicInfo.imageSrc || '')
    return shouldStorePhotoInProfileContainer(subject, currentPhotoUri)
  }

  const preparePhotoSave = async () => {
    const currentPhotoUriBeforeMigration = sanitizeTextValue(formState.basicInfo.imageSrc || '')

    if (!currentPhotoUriBeforeMigration && !formState.pendingPhotoFile) {
      return
    }

    const migratedPhotoUris = await moveProfileImagesToPhotoContainer(store, subject)
    const migratedCurrentPhotoUri = migratedPhotoUris.get(currentPhotoUriBeforeMigration)

    if (migratedCurrentPhotoUri) {
      applyRowFieldChange(formState.basicInfo, 'imageSrc', migratedCurrentPhotoUri, rowHasContent)
    }

    if (formState.pendingPhotoFile) {
      const uploadedUri = await uploadPhotoFile(store, subject, formState.pendingPhotoFile)
      formState.pendingPhotoFile = null
      applyRowFieldChange(formState.basicInfo, 'imageSrc', uploadedUri, rowHasContent)
      return
    }

    const currentPhotoUri = sanitizeTextValue(formState.basicInfo.imageSrc || '')
    if (!shouldStorePhotoInProfileContainer(subject, currentPhotoUri)) {
      return
    }

    const copiedUri = await copyPhotoToProfileContainer(store, subject, currentPhotoUri)
    applyRowFieldChange(formState.basicInfo, 'imageSrc', copiedUri, rowHasContent)
  }

  try {
    const result = await openInputDialog({
      title: editHeadingDialogTitleText,
      dom,
      form,
      headerAction: { type: 'none' },
      submitLabel: dialogSubmitLabelText,
      cancelLabel: dialogCancelLabelText,
      shouldCloseWithoutSave: () => {
        const basicInfoOps = summarizeRowOps([formState.basicInfo], rowHasContent)
        const phoneOps = summarizeHeadingContactOps(formState.phone, 'phone', formState.phoneTypeWasMissing)
        const emailOps = summarizeHeadingContactOps(formState.email, 'email', formState.emailTypeWasMissing)
        const addressOps = summarizeRowOps([formState.address], rowHasContent)

        return (
          basicInfoOps.create.length === 0 && basicInfoOps.update.length === 0 && basicInfoOps.remove.length === 0 &&
          phoneOps.create.length === 0 && phoneOps.update.length === 0 && phoneOps.remove.length === 0 &&
          emailOps.create.length === 0 && emailOps.update.length === 0 && emailOps.remove.length === 0 &&
          addressOps.create.length === 0 && addressOps.update.length === 0 && addressOps.remove.length === 0 &&
          !hasPendingPhotoMigration()
        )
      },
      validate: () => {
        if (viewerMode !== 'owner') {
          return ownerLoginRequiredDialogMessageText
        }
        return validateHeadingDataBeforeSave(formState)
      },
      onSave: async () => {
        await preparePhotoSave()

        const phoneOps = summarizeHeadingContactOps(formState.phone, 'phone', formState.phoneTypeWasMissing)
        const emailOps = summarizeHeadingContactOps(formState.email, 'email', formState.emailTypeWasMissing)
        const plan: HeadingMutationPlan = {
          basicOps: summarizeRowOps([formState.basicInfo], rowHasContent),
          phoneOps: mapPhoneOpsForSave(phoneOps),
          emailOps: mapEmailOpsForSave(emailOps),
          addressOps: summarizeRowOps([formState.address], rowHasContent)
        }
        await processHeadingMutations(store, subject, plan)
      },
      formatSaveError: (error: unknown) => {
        return error instanceof Error ? error.message : saveHeadingUpdatesFailedMessageText
      }
    })

    if (!result) return

    if (onSaved) {
      await onSaved()
    }
  } finally {
    formState.pendingPhotoFile = null
    formState.clearImagePreview()
  }
}
