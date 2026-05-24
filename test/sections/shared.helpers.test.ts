import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { graph, literal, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import {
  applyRowFieldChange,
  applyRowSelectChange,
  deleteRow,
  summarizeRowOps,
  type EditableRow
} from '../../src/sections/shared/rowState'
import {
  applyUpdaterPatch,
  collectLinkedNodeStatements,
  findExistingNode,
  runUpdateTransport,
  replacePredicateStatements
} from '../../src/sections/shared/rdfMutationHelpers'
import { createIdNode } from '../../src/sections/shared/idNodeFactory'
import {
  sanitizeAddressFieldValue,
  sanitizeBasicInputFieldValue,
  sanitizeEmailValue,
  sanitizePhoneLocalValue
} from '../../src/sections/shared/sanitizeUtils'
import { combinePhoneValue, splitPhoneValue } from '../../src/sections/shared/phoneCountries'
import {
  normalizeEmailTypeForContactInfoEdit,
  normalizeEmailTypeForEdit,
  normalizePhoneTypeForContactInfoEdit,
  normalizePhoneTypeForEdit,
  toSavedHeadingEmailType,
  toSavedHeadingPhoneType
} from '../../src/sections/shared/contactTypeUtils'
import {
  datesAsText,
  formatMonthYear,
  toggleDescription,
  updateDescriptionOverflow
} from '../../src/sections/shared/sectionCardHelpers'
import { toggleCollapsibleSection } from '../../src/sections/shared/collapsibleSection'
import {
  fallbackSaveUpdatesErrorMessageText,
  updaterUnsupportedStoreErrorMessageText
} from '../../src/texts'

type TestRow = EditableRow & {
  label: string
}

describe('shared helper utilities', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    jest.restoreAllMocks()
  })

  describe('rowState', () => {
    it('marks persisted rows as deleted and removes unsaved rows', () => {
      const existingRow: TestRow = { entryNode: 'https://example.com#1', status: 'existing', label: 'keep' }
      const newRow: TestRow = { entryNode: '', status: 'new', label: 'remove' }
      const rows = [existingRow, newRow]

      deleteRow(rows, 0)
      deleteRow(rows, 1)

      expect(existingRow.status).toBe('deleted')
      expect(rows).toHaveLength(1)
      expect(rows[0]).toBe(existingRow)
    })

    it('trims select values and updates status for existing and new rows', () => {
      const existingRow: TestRow = { entryNode: 'https://example.com#1', status: 'existing', label: '' }
      const newRow: TestRow = { entryNode: '', status: 'new', label: '' }

      applyRowSelectChange(existingRow, 'label', '  Work  ')
      applyRowSelectChange(newRow, 'label', '  Home  ')

      expect(existingRow.label).toBe('Work')
      expect(existingRow.status).toBe('modified')
      expect(newRow.label).toBe('Home')
      expect(newRow.status).toBe('new')
    })

    it('summarizes create, update, and remove operations using row content', () => {
      const result = summarizeRowOps<TestRow>([
        { entryNode: '', status: 'new', label: 'Create me' },
        { entryNode: '', status: 'new', label: '   ' },
        { entryNode: 'https://example.com#2', status: 'modified', label: 'Update me' },
        { entryNode: 'https://example.com#3', status: 'modified', label: '' },
        { entryNode: 'https://example.com#4', status: 'deleted', label: '' }
      ], (row) => row.label.trim().length > 0)

      expect(result.create).toHaveLength(1)
      expect(result.update).toHaveLength(1)
      expect(result.remove).toHaveLength(1)
    })

    it('marks empty persisted rows as deleted in field changes', () => {
      const row: TestRow = { entryNode: 'https://example.com#1', status: 'existing', label: 'Before' }

      applyRowFieldChange(row, 'label', '', (currentRow) => currentRow.label.trim().length > 0)

      expect(row.status).toBe('deleted')
    })
  })

  describe('rdfMutationHelpers', () => {
    it('throws when updater support is unavailable', async () => {
      const store = graph() as any

      expect(() => applyUpdaterPatch(store, [], [])).toThrow(updaterUnsupportedStoreErrorMessageText)
    })

    it('filters invalid statements before calling updater', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const existing = st(subject, ns.vcard('fn'), literal('Jane'), doc)
      store.add(existing.subject, existing.predicate, existing.object, existing.why)

      const update = jest.fn((_deletions: any[], _insertions: any[], callback: Function) => callback('', true))
      store.updater = { update }

      await applyUpdaterPatch(
        store,
        [existing, st(subject, ns.vcard('role'), literal('Missing'), doc)],
        [st(subject, ns.vcard('role'), literal('Engineer'), doc), { subject } as any]
      )

      expect(update).toHaveBeenCalledTimes(1)
      const [deletions, insertions] = update.mock.calls[0]
      expect(deletions).toEqual([existing])
      expect(insertions).toHaveLength(1)
      expect(insertions[0].object.value).toBe('Engineer')
    })

    it('uses the fallback save error message when updater returns no message', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      store.updater = {
        update: (_deletions: any[], _insertions: any[], callback: Function) => callback('', false)
      }

      await expect(
        applyUpdaterPatch(store, [], [st(subject, ns.vcard('role'), literal('Engineer'), doc)])
      ).rejects.toThrow(fallbackSaveUpdatesErrorMessageText)
    })

    it('registers standard RDF prefixes before updater-backed mutations run', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const updaterStore: Record<string, unknown> = {}
      const update = jest.fn((_deletions: any[], _insertions: any[], callback: Function) => callback('', true))
      store.updater = { update, store: updaterStore }

      await applyUpdaterPatch(store, [], [st(subject, ns.org('location'), literal('San Diego'), doc)])

      expect(store.namespaces?.org).toBe('http://www.w3.org/ns/org#')
      expect(store.namespaces?.schema).toBe('http://schema.org/')
      expect(store.updater.namespaces?.vcard).toBe('http://www.w3.org/2006/vcard/ns#')
      expect((store.updater.store as any).namespaces?.solid).toBe('http://www.w3.org/ns/solid/terms#')
      expect((store.updater.store as any).namespaces?.foaf).toBe('http://xmlns.com/foaf/0.1/')
      expect(update).toHaveBeenCalledTimes(1)
    })

    it('keeps standard prefixes available for PUT fallback serialization', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const serialize = jest.fn(() => '@prefix org: <http://www.w3.org/ns/org#>.')
      const webOperation = jest.fn(async () => ({ ok: true, status: 200 }))

      store.updater = {
        update: (_deletions: any[], _insertions: any[], callback: Function) => callback('', false, 'Fetch error for patch'),
        serialize,
        store: {}
      }
      store.fetcher = { webOperation }

      await runUpdateTransport(
        store,
        doc,
        [],
        [st(subject, ns.org('location'), literal('San Diego'), doc)],
        {
          unsupportedMessage: updaterUnsupportedStoreErrorMessageText,
          failureMessage: fallbackSaveUpdatesErrorMessageText,
          usePutFallback: true
        }
      )

      expect(store.updater.namespaces?.org).toBe('http://www.w3.org/ns/org#')
      expect((store.updater.store as any).namespaces?.org).toBe('http://www.w3.org/ns/org#')
      expect(serialize).toHaveBeenCalledTimes(1)
      expect(webOperation).toHaveBeenCalledTimes(1)
    })

    it('supports forced PUT transport without attempting PATCH first', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const update = jest.fn()
      const serialize = jest.fn(() => '@prefix schema: <http://schema.org/> .')
      const webOperation = jest.fn(async () => ({ ok: true, status: 200 }))

      store.updater = {
        update,
        serialize,
        store: {}
      }
      store.fetcher = { webOperation }

      await runUpdateTransport(
        store,
        doc,
        [],
        [st(subject, ns.schema('name'), literal('Jane'), doc)],
        {
          unsupportedMessage: updaterUnsupportedStoreErrorMessageText,
          failureMessage: fallbackSaveUpdatesErrorMessageText,
          forcePut: true,
          usePutFallback: true
        }
      )

      expect(update).not.toHaveBeenCalled()
      expect(serialize).toHaveBeenCalledTimes(1)
      expect(webOperation).toHaveBeenCalledTimes(1)
    })

    it('does not reload a non-empty document before forced PUT serialization', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const update = jest.fn()
      const serialize = jest.fn(() => '@prefix schema: <http://schema.org/> .')
      const webOperation = jest.fn(async () => ({ ok: true, status: 200 }))
      const load = jest.fn(async () => {
        store.add(subject, ns.schema('name'), literal('Loaded copy'), doc)
      })

      store.add(subject, ns.schema('name'), literal('Existing copy'), doc)
      store.updater = {
        update,
        serialize,
        store: {}
      }
      store.fetcher = { webOperation, load }

      await runUpdateTransport(
        store,
        doc,
        [],
        [st(subject, ns.schema('nickname'), literal('Jane'), doc)],
        {
          unsupportedMessage: updaterUnsupportedStoreErrorMessageText,
          failureMessage: fallbackSaveUpdatesErrorMessageText,
          forcePut: true,
          usePutFallback: true
        }
      )

      expect(load).not.toHaveBeenCalled()
      expect(update).not.toHaveBeenCalled()
      expect(serialize).toHaveBeenCalledTimes(1)
      expect(webOperation).toHaveBeenCalledTimes(1)
      expect(store.any(subject, ns.schema('name'), null, doc)?.value).toBe('Existing copy')
    })

    it('preloads an empty document before sanitizing forcePut deletions', async () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const remoteStatement = st(subject, ns.schema('name'), literal('Remote copy'), doc)
      const update = jest.fn()
      const serialize = jest.fn((_docValue: string, statements: any[]) => {
        expect(statements.some((statement: any) => statement.predicate?.value === ns.schema('name').value)).toBe(false)
        return '@prefix schema: <http://schema.org/> .'
      })
      const webOperation = jest.fn(async () => ({ ok: true, status: 200 }))
      const load = jest.fn(async () => {
        store.add(remoteStatement.subject, remoteStatement.predicate, remoteStatement.object, remoteStatement.why)
      })

      store.updater = {
        update,
        serialize,
        store: {}
      }
      store.fetcher = { webOperation, load }

      await runUpdateTransport(
        store,
        doc,
        [remoteStatement],
        [],
        {
          unsupportedMessage: updaterUnsupportedStoreErrorMessageText,
          failureMessage: fallbackSaveUpdatesErrorMessageText,
          forcePut: true,
          usePutFallback: true
        }
      )

      expect(load).toHaveBeenCalledTimes(1)
      expect(update).not.toHaveBeenCalled()
      expect(serialize).toHaveBeenCalledTimes(1)
      expect(webOperation).toHaveBeenCalledTimes(1)
      expect(store.statementsMatching(subject, ns.schema('name'), null, doc)).toHaveLength(0)
    })
    it('replaces predicate statements and finds linked statements by normalized node ids', () => {
      const store = graph() as any
      const subject = sym('https://example.com/profile#me')
      const doc = subject.doc()
      const linkedNode = store.bnode()
      const oldRole = st(subject, ns.vcard('role'), literal('Old role'), doc)
      store.add(oldRole.subject, oldRole.predicate, oldRole.object, oldRole.why)
      store.add(subject, ns.vcard('hasAddress'), linkedNode, doc)
      store.add(linkedNode, ns.vcard('locality'), literal('Hamburg'), doc)

      const deletions: any[] = []
      const insertions: any[] = []
      replacePredicateStatements(store, subject, ns.vcard('role'), doc, deletions, insertions, literal('New role'))

      expect(deletions).toEqual([oldRole])
      expect(insertions).toHaveLength(1)
      expect(insertions[0].object.value).toBe('New role')

      const linked = collectLinkedNodeStatements(store, subject, ns.vcard('hasAddress'), doc)
      expect(linked.linkedNodes).toHaveLength(1)
      expect(linked.linkedStatements).toHaveLength(1)
      expect(linked.linkStatements).toHaveLength(1)
      expect(findExistingNode(linked.linkedNodes, `_:${linkedNode.value}`)).toBe(linkedNode)
    })
  })

  describe('id and input normalization helpers', () => {
    it('creates monotonically increasing id nodes even within the same millisecond', () => {
      const nowSpy = jest.spyOn(Date, 'now')
      nowSpy.mockReturnValue(1700000000000)
      const doc = sym('https://example.com/profile/card')

      const first = createIdNode(doc)
      const second = createIdNode(doc)

      expect(first.value).toBe('https://example.com/profile/card#id1700000000000')
      expect(second.value).toBe('https://example.com/profile/card#id1700000000001')
    })

    it('normalizes email, phone, and basic text inputs', () => {
      expect(sanitizeEmailValue('  Jane.Doe @Example.COM  ')).toBe('jane.doe@example.com')
      expect(sanitizePhoneLocalValue(' +1 (555) ABC-123.45 ')).toBe('1 (555) -123.45')
      expect(sanitizeAddressFieldValue('  10 Downing St  ')).toBe('10 Downing St')
      expect(sanitizeBasicInputFieldValue('  Hello world  ')).toBe('Hello world')
    })

    it('does not inject a default country code into phone values', () => {
      expect(splitPhoneValue('555 123 4567')).toEqual({ dialCode: '', localNumber: '555 123 4567' })
      expect(combinePhoneValue('', '555 123 4567')).toBe('555 123 4567')
      expect(combinePhoneValue('', '+44 20 7946 0958')).toBe('+44 20 7946 0958')
      expect(splitPhoneValue('+44 20 7946 0958')).toEqual({ dialCode: '+44', localNumber: ' 20 7946 0958' })
    })

    it('normalizes phone and email types for both edit surfaces', () => {
      expect(normalizePhoneTypeForEdit('mobile')).toBe('Mobile')
      expect(normalizePhoneTypeForContactInfoEdit('office')).toBe('Work')
      expect(normalizeEmailTypeForEdit('home')).toBe('Personal')
      expect(normalizeEmailTypeForContactInfoEdit('work')).toBe('Office')
      expect(toSavedHeadingPhoneType('Mobile')).toBe('Cell')
      expect(toSavedHeadingEmailType('Personal')).toBe('Home')
    })
  })

  describe('shared section card behavior', () => {
    beforeEach(() => {
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })
    })

    it('formats month text and date ranges', () => {
      expect(formatMonthYear('2024-03-15')).toBe('Mar, 2024')
      expect(formatMonthYear()).toBe('')
      expect(datesAsText('2024-03-15', '2025-01-01')).toBe('Mar, 2024 to Jan, 2025')
      expect(datesAsText('2024-03-15')).toBe('Mar, 2024 to Present')
    })

    it('shows and toggles description overflow controls', () => {
      document.body.innerHTML = `
        <div class="resume-card__description-wrap">
          <div id="desc" class="resume-card__description-text"></div>
          <button class="resume-card__description-toggle" aria-controls="desc" aria-expanded="false" hidden>...more</button>
        </div>
      `

      const textEl = document.getElementById('desc') as HTMLElement
      const button = document.querySelector('.resume-card__description-toggle') as HTMLButtonElement

      Object.defineProperty(textEl, 'clientHeight', { configurable: true, value: 40 })
      Object.defineProperty(textEl, 'clientWidth', { configurable: true, value: 320 })
      Object.defineProperty(textEl, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({ height: 80, width: 320, top: 0, left: 0, right: 320, bottom: 80, x: 0, y: 0, toJSON: () => ({}) })
      })

      updateDescriptionOverflow(document)
      expect(button.hidden).toBe(false)

      const event = new MouseEvent('click', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'currentTarget', { configurable: true, value: button })

      toggleDescription(event)
  expect(textEl.classList.contains('resume-card__description-text--expanded')).toBe(true)
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(button.textContent).toBe('...less')

      toggleDescription(event)
  expect(textEl.classList.contains('resume-card__description-text--expanded')).toBe(false)
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(button.textContent).toBe('...more')
    })

    it('toggles collapsible sections and hides the panel when collapsed', () => {
      document.body.innerHTML = `
        <section class="profile-section-collapsible" data-expanded="false">
          <button type="button" aria-expanded="false"></button>
          <div class="profile-section-collapsible__content" aria-hidden="true" hidden></div>
        </section>
      `

      const button = document.querySelector('button') as HTMLButtonElement
      const section = document.querySelector('.profile-section-collapsible') as HTMLElement
      const panel = document.querySelector('.profile-section-collapsible__content') as HTMLElement
      const event = new MouseEvent('click', { bubbles: true })
      Object.defineProperty(event, 'currentTarget', { configurable: true, value: button })

      toggleCollapsibleSection(event)
      expect(section.getAttribute('data-expanded')).toBe('true')
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(panel.getAttribute('aria-hidden')).toBe('false')
      expect(panel.hidden).toBe(false)

      toggleCollapsibleSection(event)
      expect(section.getAttribute('data-expanded')).toBe('false')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      expect(panel.getAttribute('aria-hidden')).toBe('true')
      expect(panel.hidden).toBe(true)
    })
  })
})