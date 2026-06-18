import { alertDialog, openInputDialog } from '../../ui/dialog'
import { html, render } from 'lit-html'
import 'solid-ui/components/button'
import 'solid-ui/components/combobox'
import 'solid-ui/components/select'
import { RoleDetails, ResumeRow } from './types'
import '../../styles/EditDialogs.css'
import '../contactInfo/ContactInfoEditDialog.css'
import { LiveStore, NamedNode, literal } from 'rdflib'
import { processResumeMutations } from './mutations'
import { ViewerMode } from '../../types'
import { applyRowFieldChange, applyRowSelectChange, deleteRow, summarizeRowOps } from '../shared/rowState'
import { hasNonEmptyText, sanitizeTextValue, toText } from '../../textUtils'
import { MutationOps } from '../shared/types'
import { trashIcon } from '../../icons-svg/profileIcons'
import {
  deleteEntryButtonTitleText,
  dialogCancelLabelText,
  dialogSubmitLabelText,
  editResumeDialogTitleText,
  ownerLoginRequiredDialogMessageText,
  saveResumeUpdatesFailedMessageText
} from '../../texts'

type ResumeFormState = {
  resumeData: ResumeRow[]
}

type ResumeValidationResult = {
  ok: boolean
  message?: string
}

type ResumeOrganizationTypeOption = {
  label: string
  value: string
}

type ResumeOrganizationSuggestion = {
  label: string
  publicId: string
}

type ResumeOrganizationComboboxOption = {
  label: string
  value: string
  publicId?: string
}

type ResumeOrganizationComboboxElement = HTMLElement & {
  suggestionProvider?: (query: string) => Promise<ResumeOrganizationComboboxOption[]>
  options?: ResumeOrganizationComboboxOption[]
  value?: string
  inputValue?: string
  label?: string
  placeholder?: string
}

type ResumeFocusableElement = HTMLElement & {
  _closePopup?: () => void
}

type ResumeDateSelectKind = 'start-month' | 'start-year' | 'end-month' | 'end-year'

type ResumeOrganizationTypeSelectElement = HTMLElement & {
  options?: ResumeOrganizationTypeOption[]
  value?: string
  label?: string
}

const RESUME_ORGANIZATION_TYPE_OPTIONS: ResumeOrganizationTypeOption[] = [
  { label: 'Corporation', value: 'Corporation' },
  { label: 'Educational Organization', value: 'EducationalOrganization' },
  { label: 'Research Organization', value: 'ResearchOrganization' },
  { label: 'Government Organization', value: 'GovernmentOrganization' },
  { label: 'NGO', value: 'NGO' },
  { label: 'Performing Group', value: 'PerformingGroup' },
  { label: 'Project', value: 'Project' },
  { label: 'Sports Organization', value: 'SportsOrganization' },
  { label: 'Other', value: 'Other' }
]

const RESUME_MONTH_OPTIONS: ResumeOrganizationTypeOption[] = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

const WIKIDATA_ORGANIZATION_SEARCH_URI = 'https://www.wikidata.org/w/api.php?action=wbsearchentities&language=$(language)&type=item&limit=$(limit)&format=json&origin=*&search=$(name)'
const WIKIDATA_ENTITY_LOOKUP_URI = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=claims&ids=$(ids)'
const WIKIDATA_ORGANIZATION_SEARCH_LANGUAGE = 'en'
const WIKIDATA_ORGANIZATION_SEARCH_LIMIT = 8
const WIKIDATA_ORGANIZATION_SEARCH_CANDIDATE_LIMIT = 24

const RESUME_ORGANIZATION_TYPE_WIKIDATA_CLASS_URIS: Record<string, string[]> = {
  Corporation: ['http://www.wikidata.org/entity/Q6881511', 'http://www.wikidata.org/entity/Q4830453'],
  EducationalOrganization: ['http://www.wikidata.org/entity/Q178706', 'http://www.wikidata.org/entity/Q2385804', 'http://www.wikidata.org/entity/Q1664720'],
  ResearchOrganization: ['http://www.wikidata.org/entity/Q31855'],
  GovernmentOrganization: ['http://www.wikidata.org/entity/Q327333'],
  NGO: ['http://www.wikidata.org/entity/Q163740', 'http://www.wikidata.org/entity/Q79913', 'http://www.wikidata.org/entity/Q708676'],
  PerformingGroup: ['http://www.wikidata.org/entity/Q32178211'],
  Project: ['http://www.wikidata.org/entity/Q170584'],
  SportsOrganization: ['http://www.wikidata.org/entity/Q4438121'],
  Other: ['http://www.wikidata.org/entity/Q43229']
}

const RESUME_ORGANIZATION_SEARCH_CLASS_URIS = Array.from(
  new Set(
    RESUME_ORGANIZATION_TYPE_OPTIONS.flatMap(
      (option) => RESUME_ORGANIZATION_TYPE_WIKIDATA_CLASS_URIS[option.value] || []
    )
  )
)

const RESUME_PRESENT_MONTH_VALUE = '__present__'

function sanitizeResumeFieldValue(value: string): string {
  return sanitizeTextValue(value)
}

function normalizeResumeOrganizationPublicId(value: string): string {
  const cleaned = sanitizeResumeFieldValue(value)
  return isAbsoluteUri(cleaned) ? cleaned : ''
}

function isAbsoluteUri(value: string): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

type WikidataSearchResult = {
  id?: string
  label?: string
  match?: { text?: string }
  concepturi?: string
  url?: string
}

type WikidataEntity = {
  claims?: Record<string, Array<{
    mainsnak?: {
      snaktype?: string
      datavalue?: {
        value?: { id?: string }
      }
    }
  }>>
}

function buildWikidataOrganizationSearchUrl(name: string): string {
  return WIKIDATA_ORGANIZATION_SEARCH_URI
    .replace('$(language)', encodeURIComponent(WIKIDATA_ORGANIZATION_SEARCH_LANGUAGE))
    .replace('$(limit)', encodeURIComponent(String(WIKIDATA_ORGANIZATION_SEARCH_CANDIDATE_LIMIT)))
    .replace('$(name)', encodeURIComponent(name))
}

function buildWikidataEntityLookupUrl(ids: string[]): string {
  return WIKIDATA_ENTITY_LOOKUP_URI.replace('$(ids)', encodeURIComponent(ids.join('|')))
}

function getWikidataIdFromUri(value: string): string {
  const trimmed = sanitizeResumeFieldValue(value)
  const match = trimmed.match(/Q\d+/)
  return match ? match[0] : ''
}

function getWikidataClaimIds(entity: WikidataEntity | undefined, property: 'P31' | 'P279'): string[] {
  const claims = entity?.claims?.[property] || []

  return claims
    .map((claim) => claim?.mainsnak)
    .filter((snak) => snak?.snaktype === 'value')
    .map((snak) => snak?.datavalue?.value?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

function getAllowedOrganizationTypeIds(selectedType: string): string[] {
  const normalizedType = normalizeResumeOrganizationTypeValue(selectedType)
  const typeUris = RESUME_ORGANIZATION_TYPE_WIKIDATA_CLASS_URIS[normalizedType]

  if (!typeUris?.length) {
    return RESUME_ORGANIZATION_SEARCH_CLASS_URIS
      .map((uri) => getWikidataIdFromUri(uri))
      .filter(Boolean)
  }

  return typeUris
    .map((uri) => getWikidataIdFromUri(uri))
    .filter(Boolean)
}

const allowedOrganizationTypeIdSetCache = new Map<string, Set<string>>()

function getAllowedOrganizationTypeIdSet(selectedType: string): Set<string> {
  const normalizedType = normalizeResumeOrganizationTypeValue(selectedType)
  const cachedIds = allowedOrganizationTypeIdSetCache.get(normalizedType)

  if (cachedIds) {
    return cachedIds
  }

  const allowedIds = new Set(getAllowedOrganizationTypeIds(normalizedType))
  allowedOrganizationTypeIdSetCache.set(normalizedType, allowedIds)
  return allowedIds
}

async function fetchWikidataEntities(ids: string[]): Promise<Record<string, WikidataEntity>> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (!uniqueIds.length || typeof fetch !== 'function') return {}

  const response = await fetch(buildWikidataEntityLookupUrl(uniqueIds))
  if (!response.ok) return {}

  const payload = await response.json() as { entities?: Record<string, WikidataEntity> }
  return payload?.entities || {}
}

function entityMatchesAllowedOrganizationTypes(
  entityId: string,
  entityMap: Record<string, WikidataEntity>,
  selectedType: string
): boolean {
  const allowedIds = getAllowedOrganizationTypeIdSet(selectedType)
  const visited = new Set<string>()
  const agenda = [entityId]

  while (agenda.length) {
    const currentId = agenda.shift()
    if (!currentId || visited.has(currentId)) continue
    visited.add(currentId)

    if (allowedIds.has(currentId)) {
      return true
    }

    const entity = entityMap[currentId]
    agenda.push(...getWikidataClaimIds(entity, 'P31'))
    agenda.push(...getWikidataClaimIds(entity, 'P279'))
  }

  return false
}

function toResumeOrganizationLabel(result: any): string {
  return result?.label || result?.match?.text || result?.id || ''
}

function toResumeOrganizationSuggestion(result: WikidataSearchResult): ResumeOrganizationSuggestion {
  const label = sanitizeResumeFieldValue(toResumeOrganizationLabel(result))
  const publicId = normalizeResumeOrganizationPublicId(
    typeof result?.concepturi === 'string'
      ? result.concepturi
      : typeof result?.url === 'string'
        ? result.url
        : ''
  )

  return { label, publicId }
}

function dedupeResumeOrganizationSuggestions(
  suggestions: ResumeOrganizationSuggestion[]
): ResumeOrganizationSuggestion[] {
  const seen = new Set<string>()

  return suggestions.filter((suggestion) => {
    if (!suggestion.label || !suggestion.publicId) return false
    const key = suggestion.label.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchWikidataOrganizationSuggestions(
  name: string,
  selectedType: string
): Promise<ResumeOrganizationSuggestion[]> {
  const query = sanitizeResumeFieldValue(name)
  if (query.length < 2 || typeof fetch !== 'function') return []

  try {
    const response = await fetch(buildWikidataOrganizationSearchUrl(query))
    if (!response.ok) return []

    const payload = await response.json() as any
    const results = Array.isArray(payload?.search) ? payload.search as WikidataSearchResult[] : []
    const suggestions = dedupeResumeOrganizationSuggestions(
      results.map((result: WikidataSearchResult) => toResumeOrganizationSuggestion(result))
    )
    const resultIds = suggestions
      .map((suggestion) => getWikidataIdFromUri(suggestion.publicId))
      .filter(Boolean)

    if (!resultIds.length) {
      return suggestions.slice(0, WIKIDATA_ORGANIZATION_SEARCH_LIMIT)
    }

    const resultEntities = await fetchWikidataEntities(resultIds)
    const relatedIds = Array.from(new Set(
      Object.values(resultEntities).flatMap((entity) => [
        ...getWikidataClaimIds(entity, 'P31'),
        ...getWikidataClaimIds(entity, 'P279')
      ])
    ))
    const relatedEntities = await fetchWikidataEntities(relatedIds)
    const entityMap = {
      ...resultEntities,
      ...relatedEntities
    }

    if (Object.keys(entityMap).length === 0) {
      return suggestions.slice(0, WIKIDATA_ORGANIZATION_SEARCH_LIMIT)
    }

    const filteredSuggestions = suggestions.filter((suggestion) => {
      const entityId = getWikidataIdFromUri(suggestion.publicId)
      return entityMatchesAllowedOrganizationTypes(entityId, entityMap, selectedType)
    })

    return filteredSuggestions.slice(0, WIKIDATA_ORGANIZATION_SEARCH_LIMIT)
  } catch {
    return []
  }
}

function toResumeOrganizationComboboxOption(suggestion: ResumeOrganizationSuggestion): ResumeOrganizationComboboxOption {
  return {
    label: suggestion.label,
    value: suggestion.publicId,
    publicId: suggestion.publicId
  }
}

function readResumeOrganizationComboboxInputValue(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function readResumeOrganizationComboboxChange(event: Event): ResumeOrganizationComboboxOption | null {
  const customEvent = event as CustomEvent<{
    value?: string,
    label?: string,
    option?: ResumeOrganizationComboboxOption
  }>

  if (customEvent.detail?.option) {
    return customEvent.detail.option
  }

  return null
}

function createResumeOrganizationSuggestionProvider(
  getSelectedType: () => string
): (query: string) => Promise<ResumeOrganizationComboboxOption[]> {
  return async (query: string) => {
    const suggestions = await fetchWikidataOrganizationSuggestions(query, getSelectedType())
    return suggestions.map(toResumeOrganizationComboboxOption)
  }
}

function normalizeResumeOrganizationTypeValue(value: string): string {
  return RESUME_ORGANIZATION_TYPE_OPTIONS.some((option) => option.value === value)
    ? value
    : RESUME_ORGANIZATION_TYPE_OPTIONS[0]?.value || ''
}

function readResumeOrganizationTypeChange(event: Event): string {
  const customEvent = event as CustomEvent<{ value?: string }>
  if (typeof customEvent.detail?.value === 'string') {
    return customEvent.detail.value
  }

  const target = event.target as HTMLSelectElement | HTMLInputElement | null
  return typeof target?.value === 'string' ? target.value : ''
}

function readResumeSelectChange(event: Event): string {
  return readResumeOrganizationTypeChange(event)
}

function getResumeYearOptions(selectedYears: string[]): ResumeOrganizationTypeOption[] {
  const currentYear = new Date().getFullYear()
  const baseYearOptions = Array.from({ length: 120 }, (_, i) => String(currentYear - i))
  const yearOptions = Array.from(new Set([
    ...baseYearOptions,
    ...selectedYears
  ].filter(Boolean))).sort((a, b) => Number(b) - Number(a))

  return yearOptions.map((year) => ({ label: year, value: year }))
}

function getResumeDateSelectOptions(
  kind: ResumeDateSelectKind,
  selectedYears: string[],
  isCurrentRole: boolean
): ResumeOrganizationTypeOption[] {
  if (kind === 'start-month') {
    return RESUME_MONTH_OPTIONS
  }

  if (kind === 'start-year') {
    return getResumeYearOptions(selectedYears)
  }

  if (kind === 'end-month') {
    if (isCurrentRole) {
      return [{ value: RESUME_PRESENT_MONTH_VALUE, label: 'Present' }]
    }

    return RESUME_MONTH_OPTIONS
  }

  if (kind === 'end-year' && isCurrentRole) {
    return [{ value: '', label: '' }]
  }

  return getResumeYearOptions(selectedYears)
}

function getResumeDateSelectLabel(kind: ResumeDateSelectKind, row: ResumeRow): string {
  switch (kind) {
    case 'start-month':
    case 'end-month':
      return row?.isCurrentRole && kind === 'end-month' ? 'Present' : 'Select Month'
    case 'start-year':
      return 'Select Year'
    case 'end-year':
      return row?.isCurrentRole ? '' : 'Select Year'
    default:
      return ''
  }
}

function getResumeDateSelectValue(kind: ResumeDateSelectKind, row: ResumeRow): string {
  const startDateParts = parseYearMonthFromDateText(toText(row?.startDate))
  const endDateParts = parseYearMonthFromDateText(toText(row?.endDate))

  switch (kind) {
    case 'start-month':
      return startDateParts.month
    case 'start-year':
      return startDateParts.year
    case 'end-month':
      return row?.isCurrentRole ? RESUME_PRESENT_MONTH_VALUE : endDateParts.month
    case 'end-year':
      return row?.isCurrentRole ? '' : endDateParts.year
    default:
      return ''
  }
}

function parseYearMonthFromDateText(dateText: string): { year: string, month: string } {
  const normalized = (dateText || '').trim()
  if (!normalized) return { year: '', month: '' }

  const isoYearMonth = normalized.match(/^(\d{4})-(\d{2})/)
  if (isoYearMonth) {
    return { year: isoYearMonth[1], month: isoYearMonth[2] }
  }

  const fallbackYear = normalized.match(/(\d{4})/)
  return {
    year: fallbackYear ? fallbackYear[1] : '',
    month: ''
  }
}

function rowHasContent(row: ResumeRow): boolean {

  return Boolean(row.isCurrentRole) || [
    row.title,
    row.roleType,
    toText(row.startDate),
    toText(row.endDate),
    row.orgName,
    row.orgType,
    row.orgLocation,
    row.orgHomePage,
    row.description
  ].some(hasNonEmptyText)
}

function toFormState(resumeData: RoleDetails[]): ResumeFormState {

  const roles = (resumeData || [])
    .map((role) => ({
      title: sanitizeResumeFieldValue(toText(role.title)),
      roleType: sanitizeResumeFieldValue(toText(role.roleType)),
      startDate: role.startDate,
      endDate: role.endDate,
      isCurrentRole: role.isCurrentRole ?? !role.endDate,
      orgName: sanitizeResumeFieldValue(toText(role.orgName)),
      orgPublicId: normalizeResumeOrganizationPublicId(sanitizeResumeFieldValue(toText(role.orgPublicId))),
      orgType: normalizeResumeOrganizationTypeValue(sanitizeResumeFieldValue(toText(role.orgType))),
      orgLocation: sanitizeResumeFieldValue(toText(role.orgLocation)),
      orgHomePage: sanitizeResumeFieldValue(toText(role.orgHomePage)),
      description: sanitizeResumeFieldValue(toText(role.description)),
      entryNode: toText(role.entryNode),
      status: toText(role.entryNode) ? 'existing' as const : 'new' as const
    }))
    .filter((role) => rowHasContent(role) || Boolean(role.entryNode))

  return {
    resumeData: roles.length
      ? roles
      : [{
        title: '',
        roleType: '',
        startDate: undefined,
        endDate: undefined,
        isCurrentRole: false,
        orgName: '',
        orgPublicId: '',
        orgType: RESUME_ORGANIZATION_TYPE_OPTIONS[0].value,
        orgLocation: '',
        orgHomePage: '',
        description: '',
        entryNode: '',
        status: 'new'
      }]
  }
}

function validateResumeBeforeSave(rows: ResumeRow[]): ResumeValidationResult {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.status === 'deleted') continue
    if (!rowHasContent(row)) continue

    const endDateText = toText(row.endDate).trim()
    if (!row.isCurrentRole && !endDateText) {
      return {
        ok: false,
        message: `Resume ${i + 1}: End Year is required unless "I am currently working in this role" is selected.`
      }
    }
  }

  return { ok: true }
}

type ResumeEditableField =
  | 'title'
  | 'startDate'
  | 'endDate'
  | 'isCurrentRole'
  | 'orgName'
  | 'orgType'
  | 'orgLocation'
  | 'orgHomePage'
  | 'description'

type ResumeRowProps = {
  resumeData: ResumeRow[]
  index: number
  displayIndex: number
  onDelete: () => void
  onChange: () => void
}

function initializeResumeOrganizationTypeSelects(form: HTMLFormElement, resumeData: ResumeRow[]): void {
  const selectElements = form.querySelectorAll('solid-ui-select[data-resume-organization-type-index]') as NodeListOf<ResumeOrganizationTypeSelectElement>

  selectElements.forEach((selectElement) => {
    const rowIndex = Number(selectElement.dataset.resumeOrganizationTypeIndex)
    if (Number.isNaN(rowIndex)) return

    const resumeRow = resumeData[rowIndex]
    if (!resumeRow) return

    selectElement.options = RESUME_ORGANIZATION_TYPE_OPTIONS
    selectElement.value = normalizeResumeOrganizationTypeValue(resumeRow.orgType || '')
    selectElement.label = ''
  })
}

function initializeResumeOrganizationComboboxes(form: HTMLFormElement, resumeData: ResumeRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-resume-organization-index]') as NodeListOf<ResumeOrganizationComboboxElement>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.resumeOrganizationIndex)
    if (Number.isNaN(rowIndex)) return

    const resumeRow = resumeData[rowIndex]
    if (!resumeRow) return

    const options = resumeRow.orgPublicId && resumeRow.orgName
      ? [{ label: resumeRow.orgName, value: resumeRow.orgPublicId, publicId: resumeRow.orgPublicId }]
      : []

    comboboxElement.suggestionProvider = createResumeOrganizationSuggestionProvider(
      () => normalizeResumeOrganizationTypeValue(resumeRow.orgType || '')
    )
    comboboxElement.options = options
    comboboxElement.value = resumeRow.orgPublicId || ''
    comboboxElement.inputValue = resumeRow.orgName || ''
    comboboxElement.label = ''
    comboboxElement.placeholder = 'Company or Organization'
  })
}

function syncResumeOrganizationRowsFromComboboxes(form: HTMLFormElement, resumeData: ResumeRow[]): void {
  const comboboxElements = form.querySelectorAll('solid-ui-combobox[data-resume-organization-index]') as NodeListOf<ResumeOrganizationComboboxElement>

  comboboxElements.forEach((comboboxElement) => {
    const rowIndex = Number(comboboxElement.dataset.resumeOrganizationIndex)
    if (Number.isNaN(rowIndex) || !resumeData[rowIndex]) return

    const comboboxInput = comboboxElement.shadowRoot?.querySelector('input') as HTMLInputElement | null
    const nextName = sanitizeResumeFieldValue(comboboxInput?.value || comboboxElement.inputValue || '')
    const nextPublicId = normalizeResumeOrganizationPublicId(comboboxElement.value || '')

    applyRowFieldChange(resumeData[rowIndex], 'orgName', nextName, rowHasContent)
    resumeData[rowIndex].orgPublicId = nextPublicId
  })
}

function initializeResumeDateSelects(form: HTMLFormElement, resumeData: ResumeRow[]): void {
  const selectElements = form.querySelectorAll('solid-ui-select[data-resume-date-kind]') as NodeListOf<ResumeOrganizationTypeSelectElement>

  selectElements.forEach((selectElement) => {
    const kind = selectElement.dataset.resumeDateKind as ResumeDateSelectKind | undefined
    const rowIndex = Number(selectElement.dataset.resumeRowIndex)
    if (!kind || Number.isNaN(rowIndex)) return

    const resumeRow = resumeData[rowIndex]
    if (!resumeRow) return

    const startDateParts = parseYearMonthFromDateText(toText(resumeRow.startDate))
    const endDateParts = parseYearMonthFromDateText(toText(resumeRow.endDate))
    const selectedYears = [startDateParts.year, endDateParts.year]

    selectElement.options = getResumeDateSelectOptions(kind, selectedYears, Boolean(resumeRow.isCurrentRole))
    selectElement.value = getResumeDateSelectValue(kind, resumeRow)
    selectElement.label = getResumeDateSelectLabel(kind, resumeRow)
  })
}

function renderResumeInputRow({
  resumeData,
  index,
  displayIndex,
  onDelete,
  onChange
}: ResumeRowProps) {
  const resumeRow = resumeData[index]
  const label = `Resume ${displayIndex + 1}`
  const experienceHeadingId = `resume-experience-heading-${index}`
  
  const titleName = `resume-title-${index}`
  const organizationName = `resume-organization-${index}`
  const organizationTypeName = `resume-organization-type-${index}`
  const organizationTypeSelectId = `resume-organization-type-select-${index}`
  const companyUrlName = `resume-company-url-${index}`
  const orgLocationName = `resume-org-location-${index}`
  const descriptionName = `resume-description-${index}`
  const descriptionCounterId = `resume-description-counter-${index}`
  const descriptionMaxLength = 2000
  const descriptionCount = (resumeRow?.description || '').length

  const startMonthLabel = `Start Month ${displayIndex + 1}`
  const startMonthInputName = `resume-start-month-${index}`
  const startMonthSelectId = `resume-start-month-select-${index}`
  const startYearLabel = `Start Year ${displayIndex + 1}`
  const startYearInputName = `resume-start-year-${index}`
  const startYearSelectId = `resume-start-year-select-${index}`
  const startDateText = toText(resumeRow?.startDate)
  const startDateParts = parseYearMonthFromDateText(startDateText)
  const startMonthValue = startDateParts.month
  const startYearText = startDateParts.year
  const endMonthLabel = `End Month ${displayIndex + 1}`
  const endMonthInputName = `resume-end-month-${index}`
  const endMonthSelectId = `resume-end-month-select-${index}`
  const endDateText = toText(resumeRow?.endDate)
  const endYearLabel = `End Year ${displayIndex + 1}`
  const endYearInputName = `resume-end-year-${index}`
  const endYearSelectId = `resume-end-year-select-${index}`
  const endDateParts = parseYearMonthFromDateText(endDateText)
  const endMonthValue = endDateParts.month
  const endYearParsedText = endDateParts.year
  const isCurrentRoleId = `resume-current-role-${index}`
  const currentYear = new Date().getFullYear()
  const selectedYears = [startYearText, endYearParsedText]

  const handleResumeInput = (field: ResumeEditableField) => (e: Event) => {
    const target = e.target as HTMLInputElement
    const nextValue = sanitizeResumeFieldValue(target.value)
    if (resumeRow) {
      applyRowFieldChange(resumeRow, field, nextValue, rowHasContent)
      onChange()
    }
  }

  const handleDelete = (event: Event) => {
    event.preventDefault()
    onDelete()
  }

  const buildDateLiteral = (month: string, year: string) => {
    if (!month || !year) return undefined
    return literal(`${year}-${month}-01`)
  }

  /* The following function was generated by AI Model: GPT-5.3-Codex  */
  /* Prompt: can you make this a month drop down for the start year */
  const handleStartMonthChange = (event: Event) => {
    const month = readResumeSelectChange(event)
    const year = parseYearMonthFromDateText(toText(resumeData[index]?.startDate)).year || String(currentYear)
    const nextStartDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleStartYearChange = (event: Event) => {
    const year = readResumeSelectChange(event)
    const month = parseYearMonthFromDateText(toText(resumeData[index]?.startDate)).month || '01'
    const nextStartDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'startDate', nextStartDate, rowHasContent)
      onChange()
    }
  }

  const handleEndMonthChange = (event: Event) => {
    if (resumeData[index]?.isCurrentRole) return
    const month = readResumeSelectChange(event)
    const year = parseYearMonthFromDateText(toText(resumeData[index]?.endDate)).year || String(currentYear)
    const nextEndDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleEndYearChange = (event: Event) => {
    if (resumeData[index]?.isCurrentRole) return
    const year = readResumeSelectChange(event)
    const month = parseYearMonthFromDateText(toText(resumeData[index]?.endDate)).month || '01'
    const nextEndDate = buildDateLiteral(month, year)
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'endDate', nextEndDate, rowHasContent)
      onChange()
    }
  }

  const handleDescriptionInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement
    const nextValue = sanitizeResumeFieldValue(target.value.slice(0, descriptionMaxLength))
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'description', nextValue, rowHasContent)
      onChange()
    }
  }

  const handleCurrentRoleToggle = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (resumeData[index]) {
      applyRowFieldChange(resumeData[index], 'isCurrentRole', target.checked, rowHasContent)
      if (target.checked) {
        applyRowFieldChange(resumeData[index], 'endDate', undefined, rowHasContent)
      }

      onChange()
    }
  }

  const handleOrganizationTypeInput = (e: Event) => {
    const nextType = normalizeResumeOrganizationTypeValue(readResumeOrganizationTypeChange(e))
    if (resumeRow) {
      applyRowSelectChange(resumeRow, 'orgType', nextType)
      resumeRow.orgPublicId = ''
      onChange()
    }
  }

  const handleOrganizationNameInput = (e: Event) => {
    const nextValue = sanitizeResumeFieldValue(readResumeOrganizationComboboxInputValue(e))
    if (resumeRow) {
      applyRowFieldChange(resumeRow, 'orgName', nextValue, rowHasContent)
      resumeRow.orgPublicId = ''
    }
  }

  const handleOrganizationNameChange = (e: Event) => {
    const selectedOption = readResumeOrganizationComboboxChange(e)
    if (!resumeRow || !selectedOption?.publicId) return

    applyRowFieldChange(resumeRow, 'orgName', sanitizeResumeFieldValue(selectedOption.label), rowHasContent)
    resumeRow.orgPublicId = selectedOption.publicId
  }

  return html`
    <div class="profile-edit-dialog__row profile-edit-dialog__row--resume-entry-header" role="group" aria-labelledby=${experienceHeadingId}>
      <h3 id=${experienceHeadingId} class="profile-edit-dialog__entry-heading">${label}</h3>
      <div class="profile-edit-dialog__actions profile-edit-dialog__actions--edge">
        <solid-ui-button
          type="button"
          variant="icon"
          size="md"
          class="profile-edit-dialog__delete-button"
          aria-label=${`Delete resume ${displayIndex + 1}`}
          title=${deleteEntryButtonTitleText}
          @click=${handleDelete}
        >
          <span slot="icon" class="profile-edit-dialog__delete-icon" aria-hidden="true">${trashIcon}</span>
        </solid-ui-button>
      </div>
    </div>
    <label aria-label=${`${label} Title`} class="label profile-edit-dialog__field">
      Title
      <input
        class="input"
        type="text"
        name=${titleName}
        .value=${resumeRow?.title || ''}
        data-contact-field="title"
        data-entry-node=${resumeRow?.entryNode || ''}
        data-row-status=${resumeRow?.status || 'n/a'}
        placeholder="Title"
        autocomplete="title"
        inputmode="text"
        @change=${handleResumeInput('title')}
      />
    </label>
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Organization Type`} class="label profile-edit-dialog__field">
        Organization Type
        <solid-ui-select
          class="profile-edit-dialog__resume-organization-type-select"
          name=${organizationTypeName}
          id=${organizationTypeSelectId}
          data-resume-organization-type-index=${String(index)}
          .options=${RESUME_ORGANIZATION_TYPE_OPTIONS}
          .value=${normalizeResumeOrganizationTypeValue(resumeRow?.orgType || '')}
          .label=${''}
          @change=${handleOrganizationTypeInput}
        ></solid-ui-select>
      </label>
      <label aria-label=${`${label} Organization Name`} class="label profile-edit-dialog__field">
        Company or Organization 
        <solid-ui-combobox
          name=${organizationName}
          data-resume-organization-index=${String(index)}
          required
          @input=${handleOrganizationNameInput}
          @change=${handleOrganizationNameChange}
        ></solid-ui-combobox>
      </label>
    </div>  
    <div class="profile-edit-dialog__row">
      <label aria-label=${`${label} Company URL`} class="label profile-edit-dialog__field">
        Company URL
        <input
          class="input"
          type="text"
          name=${companyUrlName}
          .value=${resumeRow?.orgHomePage || ''}
          data-contact-field="orgHomePage"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Company URL"
          autocomplete="url"
          inputmode="text"
          @change=${handleResumeInput('orgHomePage')}
        />
      </label>
      <label aria-label=${`${label} Location`} class="label profile-edit-dialog__field profile-edit-dialog__field--resume-location">
        Location
        <input
          class="input"
          type="text"
          name=${orgLocationName}
          .value=${resumeRow?.orgLocation || ''}
          data-contact-field="orgLocation"
          data-entry-node=${resumeRow?.entryNode || ''}
          data-row-status=${resumeRow?.status || 'n/a'}
          placeholder="Location"
          autocomplete="address-level2"
          inputmode="text"
          @change=${handleResumeInput('orgLocation')}
        />
      </label>
    </div>
    <div class="profile-edit-dialog__row profile-edit-dialog__row--resume-dates">
      <label aria-label=${`Start Date ${displayIndex + 1}`} class="label profile-edit-dialog__field profile-edit-dialog__field--date-group">
        <span>Start Date</span>
        <div class="profile-edit-dialog__date-pair">
          <solid-ui-select
            class="profile-edit-dialog__resume-date-select"
            name=${startMonthInputName}
            id=${startMonthSelectId}
            aria-label=${startMonthLabel}
            data-resume-date-kind="start-month"
            data-resume-row-index=${String(index)}
            .options=${getResumeDateSelectOptions('start-month', selectedYears, Boolean(resumeRow?.isCurrentRole))}
            .value=${startMonthValue}
            .label=${getResumeDateSelectLabel('start-month', resumeRow)}
            @change=${handleStartMonthChange}
          ></solid-ui-select>
          <solid-ui-select
            class="profile-edit-dialog__resume-date-select"
            name=${startYearInputName}
            id=${startYearSelectId}
            aria-label=${startYearLabel}
            data-resume-date-kind="start-year"
            data-resume-row-index=${String(index)}
            .options=${getResumeDateSelectOptions('start-year', selectedYears, Boolean(resumeRow?.isCurrentRole))}
            .value=${startYearText}
            .label=${getResumeDateSelectLabel('start-year', resumeRow)}
            @change=${handleStartYearChange}
          ></solid-ui-select>
        </div>
      </label>
      <label aria-label=${`End Date ${displayIndex + 1}`} class="label profile-edit-dialog__field profile-edit-dialog__field--date-group">
        <span>End Date</span>
        <div class="profile-edit-dialog__date-pair">
          <solid-ui-select
            class=${`profile-edit-dialog__resume-date-select${resumeRow?.isCurrentRole ? ' profile-edit-dialog__resume-date-select--disabled' : ''}`}
            name=${endMonthInputName}
            id=${endMonthSelectId}
            aria-label=${endMonthLabel}
            aria-disabled=${String(Boolean(resumeRow?.isCurrentRole))}
            tabindex=${resumeRow?.isCurrentRole ? '-1' : '0'}
            data-resume-date-kind="end-month"
            data-resume-row-index=${String(index)}
            .options=${getResumeDateSelectOptions('end-month', selectedYears, Boolean(resumeRow?.isCurrentRole))}
            .value=${resumeRow?.isCurrentRole ? RESUME_PRESENT_MONTH_VALUE : endMonthValue}
            .label=${getResumeDateSelectLabel('end-month', resumeRow)}
            @change=${handleEndMonthChange}
          ></solid-ui-select>
          <solid-ui-select
            class=${`profile-edit-dialog__resume-date-select${resumeRow?.isCurrentRole ? ' profile-edit-dialog__resume-date-select--disabled' : ''}`}
            name=${endYearInputName}
            id=${endYearSelectId}
            aria-label=${endYearLabel}
            aria-disabled=${String(Boolean(resumeRow?.isCurrentRole))}
            tabindex=${resumeRow?.isCurrentRole ? '-1' : '0'}
            data-resume-date-kind="end-year"
            data-resume-row-index=${String(index)}
            .options=${getResumeDateSelectOptions('end-year', selectedYears, Boolean(resumeRow?.isCurrentRole))}
            .value=${resumeRow?.isCurrentRole ? '' : endYearParsedText}
            .label=${getResumeDateSelectLabel('end-year', resumeRow)}
            @change=${handleEndYearChange}
          ></solid-ui-select>
        </div>
      </label>
    </div>
    <div class="profile-edit-dialog__row profile-edit-dialog__row--inline-end">
      <label class="label profile-edit-dialog__checkbox-label" for=${isCurrentRoleId}>
        <input
          class="profile-edit-dialog__checkbox-input"
          type="checkbox"
          id=${isCurrentRoleId}
          name="isCurrentRole"
          .checked=${Boolean(resumeRow?.isCurrentRole)}
          @change=${handleCurrentRoleToggle}
        />
        <span>I am currently working in this role</span>
      </label>
    </div>
    <label aria-label=${`${label} Description`} class="label profile-edit-dialog__field profile-edit-dialog__field--full profile-edit-dialog__field--stack">
      <span>Description</span>
      <textarea
        class="profile-edit-dialog__textarea"
        name=${descriptionName}
        rows="4"
        .value=${resumeRow?.description || ''}
        maxlength=${descriptionMaxLength}
        aria-describedby=${descriptionCounterId}
        data-contact-field="description"
        data-entry-node=${resumeRow?.entryNode || ''}
        data-row-status=${resumeRow?.status || 'n/a'}
        placeholder="Description"
        autocomplete="off"
        inputmode="text"
        @input=${handleDescriptionInput}
      ></textarea>
      <small id=${descriptionCounterId} aria-live="polite">${descriptionCount}/${descriptionMaxLength}</small>
    </label>
  `
}

function renderResumeSection(resumeData: ResumeRow[], onAddRow: () => void) {
  const visibleResumeRows = resumeData
    .map((resume, index) => ({ resume, index }))
    .filter(({ resume }) => resume.status !== 'deleted')

  return html`
    <section class="profile-edit-dialog__section profile-edit-dialog__section--resume" aria-label="Resume">
      <fieldset>
        <legend class="sr-only">Resume entries</legend>
        ${visibleResumeRows.map(({ index }, displayIndex) => renderResumeInputRow({
          resumeData,
          index,
          displayIndex,
          onDelete: () => {
            deleteRow(resumeData, index)
            onAddRow()
          },
          onChange: onAddRow
        }))}
      </fieldset>
    </section>
  `
}

function renderResumeEditTemplate(
  form: HTMLFormElement,
  formState: ResumeFormState,
  rerender: () => void,
  viewerMode: ViewerMode
) {
  render(html`
    ${renderResumeSection(formState.resumeData, rerender)}
    ${viewerMode !== 'owner'
      ? html`<p class="profile-edit-dialog__login-message">${ownerLoginRequiredDialogMessageText}</p>`
      : null}
  `, form)

  initializeResumeOrganizationTypeSelects(form, formState.resumeData)
  initializeResumeOrganizationComboboxes(form, formState.resumeData)
  initializeResumeDateSelects(form, formState.resumeData)
}

type ResumeDialogRenderState = {
  dialogScrollTop: number
  descriptionScrollTop: number
  activeId: string
  activeName: string
  selectionStart: number | null
  selectionEnd: number | null
  fieldScrollLeft: number
  fieldScrollTop: number
}

type ResumeFocusOptions = {
  selectionStart?: number | null
  selectionEnd?: number | null
  scrollLeft?: number
  scrollTop?: number
}

type ResumeRerenderOptions = {
  preserveState?: boolean
  focusSelector?: string
}

function captureResumeDialogRenderState(form: HTMLFormElement): ResumeDialogRenderState {
  const dialog = form.closest('dialog') as HTMLDialogElement | null
  const description = dialog?.querySelector('#modal-desc') as HTMLDivElement | null
  const activeElement = form.ownerDocument.activeElement as HTMLElement | null
  const activeTextField = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
    ? activeElement
    : null

  return {
    dialogScrollTop: dialog?.scrollTop || 0,
    descriptionScrollTop: description?.scrollTop || 0,
    activeId: activeElement?.id || '',
    activeName: activeElement?.getAttribute('name') || '',
    selectionStart: activeTextField?.selectionStart ?? null,
    selectionEnd: activeTextField?.selectionEnd ?? null,
    fieldScrollLeft: activeTextField?.scrollLeft || 0,
    fieldScrollTop: activeTextField?.scrollTop || 0
  }
}

function restoreResumeDialogRenderState(form: HTMLFormElement, state: ResumeDialogRenderState): void {
  const dialog = form.closest('dialog') as HTMLDialogElement | null
  const description = dialog?.querySelector('#modal-desc') as HTMLDivElement | null

  if (dialog) dialog.scrollTop = state.dialogScrollTop
  if (description) description.scrollTop = state.descriptionScrollTop

  const escapedId = state.activeId && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(state.activeId)
    : state.activeId
  const escapedName = state.activeName && typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(state.activeName)
    : state.activeName

  let nextActive: HTMLElement | null = null
  if (escapedId) {
    nextActive = form.querySelector(`#${escapedId}`) as HTMLElement | null
  }
  if (!nextActive && escapedName) {
    nextActive = form.querySelector(`[name="${escapedName}"]`) as HTMLElement | null
  }

  focusResumeFieldElement(nextActive, {
    selectionStart: state.selectionStart,
    selectionEnd: state.selectionEnd,
    scrollLeft: state.fieldScrollLeft,
    scrollTop: state.fieldScrollTop
  })
}

function getResumeFocusableTarget(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  if (element.tagName === 'SOLID-UI-COMBOBOX') {
    const comboboxInput = element.shadowRoot?.querySelector('input') as HTMLInputElement | null
    if (comboboxInput) return comboboxInput
  }

  return element
}

function focusResumeFieldElement(element: HTMLElement | null, options: ResumeFocusOptions = {}): void {
  const focusTarget = getResumeFocusableTarget(element)
  if (!focusTarget || typeof focusTarget.focus !== 'function') return

  const view = focusTarget.ownerDocument.defaultView
  const shouldAvoidFocus = Boolean(
    view?.matchMedia &&
    (view.matchMedia('(pointer: coarse)').matches || view.matchMedia('(max-width: 640px)').matches)
  )

  if (shouldAvoidFocus) {
    focusTarget.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    return
  }

  focusTarget.focus({ preventScroll: true })
  if (focusTarget instanceof HTMLInputElement || focusTarget instanceof HTMLTextAreaElement) {
    const selectionStart = options.selectionStart ?? focusTarget.value.length
    const selectionEnd = options.selectionEnd ?? selectionStart

    focusTarget.setSelectionRange(selectionStart, selectionEnd)
    focusTarget.scrollLeft = options.scrollLeft ?? focusTarget.scrollLeft
    focusTarget.scrollTop = options.scrollTop ?? focusTarget.scrollTop
    requestAnimationFrame(() => {
      focusTarget.scrollLeft = options.scrollLeft ?? focusTarget.scrollLeft
      focusTarget.scrollTop = options.scrollTop ?? focusTarget.scrollTop
    })
  }

  if (element?.tagName === 'SOLID-UI-COMBOBOX') {
    const comboboxHost = element as ResumeFocusableElement
    if (comboboxHost._closePopup) {
      requestAnimationFrame(() => {
        comboboxHost._closePopup?.()
      })
    }
  }
}

function focusResumeField(form: HTMLFormElement, selector: string): void {
  const nextField = form.querySelector(selector) as HTMLElement | null
  if (!nextField) return

  focusResumeFieldElement(nextField)
}

function createResumeEditForm(resumeData: RoleDetails[], viewerMode: ViewerMode) {
  const form = document.createElement('form')
  form.classList.add('profile__edit-form')
  form.classList.add('profile__edit-form--resume')

  const formState = toFormState(resumeData)
  const rerender = (options: ResumeRerenderOptions = {}) => {
    const { preserveState = true, focusSelector } = options
    const renderState = preserveState ? captureResumeDialogRenderState(form) : null
    renderResumeEditTemplate(form, formState, rerender, viewerMode)
    if (renderState) {
      restoreResumeDialogRenderState(form, renderState)
    }
    if (focusSelector) {
      focusResumeField(form, focusSelector)
    }
  }
  rerender()

  const addRow = () => {
    formState.resumeData.unshift({
      title: '',
      roleType: '',
      startDate: undefined,
      endDate: undefined,
      isCurrentRole: false,
      orgName: '',
      orgPublicId: '',
      orgType: RESUME_ORGANIZATION_TYPE_OPTIONS[0].value,
      orgLocation: '',
      orgHomePage: '',
      description: '',
      entryNode: '',
      status: 'new'
    })
    rerender({ preserveState: false, focusSelector: '[name="resume-title-0"]' })
  }

  return { form, formState, rerender, addRow }
}


export async function createResumeEditDialog(
  event: Event,
  store: LiveStore,
  subject: NamedNode,
  resumeData: RoleDetails[],
  viewerMode: ViewerMode,
  onSaved?: () => Promise<void> | void
) {
  const dom = (event.currentTarget as HTMLElement | null)?.ownerDocument || document
  const { form, formState, rerender, addRow } = createResumeEditForm(resumeData, viewerMode)

  const result = await openInputDialog({
    title: editResumeDialogTitleText,
    dom,
    form,
    shouldCloseWithoutSave: () => {
      syncResumeOrganizationRowsFromComboboxes(form, formState.resumeData)
      const plan: MutationOps<ResumeRow> = summarizeRowOps(formState.resumeData, rowHasContent)
      return plan.create.length === 0 && plan.update.length === 0 && plan.remove.length === 0
    },
    headerAction: {
      type: 'button',
      label: '+ Add More',
      ariaLabel: 'Add another resume entry',
      onClick: addRow
    },
    submitLabel: dialogSubmitLabelText,
    cancelLabel: dialogCancelLabelText,
    validate: async () => {
      syncResumeOrganizationRowsFromComboboxes(form, formState.resumeData)
      if (viewerMode !== 'owner') {
        return ownerLoginRequiredDialogMessageText
      }

      const validation = validateResumeBeforeSave(formState.resumeData)
      if (!validation.ok) {
        return validation.message || 'Please complete the required resume fields.'
      }

      return null
    },
    onSave: async () => {
      syncResumeOrganizationRowsFromComboboxes(form, formState.resumeData)
      const plan: MutationOps<ResumeRow> = summarizeRowOps(formState.resumeData, rowHasContent)
      await processResumeMutations(store, subject, plan)
      rerender()
    },
    formatSaveError: (error: unknown) => {
      return error instanceof Error ? error.message : saveResumeUpdatesFailedMessageText
    }
  })

  if (!result) return
  if (onSaved) {
    await onSaved()
    return
  }
  await alertDialog('Resume updates saved. Refresh to see latest values.', 'Saved', dom)
}
