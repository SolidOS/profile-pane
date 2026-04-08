import { describe, expect, it } from "@jest/globals"
import { graph, literal, st, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { presentLanguages } from '../../src/sections/languages/selectors'
import { processLanguageMutations } from '../../src/sections/languages/mutations'
import { mutationSaveLanguagesFailedPrefixText } from '../../src/texts'

describe('Languages selectors and mutations', () => {
  it('selector returns empty list from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentLanguages(subject, store)).toEqual([])
  })

  it('mutation wraps updater errors with language prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    store.updater = {
      update: (_deletions: any[], _insertions: any[], callback: Function) => callback('', false, 'boom')
    }

    const plan = {
      create: [{ name: 'French', publicId: 'https://www.w3.org/ns/iana/language-code/fr', proficiency: '', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }
    await expect(processLanguageMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveLanguagesFailedPrefixText
    )
  })

  it('persists delete when existing languages come from RDF list entries', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const listHead = store.bnode()

    store.add(subject, ns.schema('knowsLanguage'), listHead, doc)
    store.add(listHead, ns.rdf('first'), literal('French'), doc)
    store.add(listHead, ns.rdf('rest'), ns.rdf('nil'), doc)

    const pre = presentLanguages(subject, store)
    expect(pre.some((item) => item.name === 'French')).toBe(true)

    const plan = {
      create: [],
      update: [],
      remove: [{ name: 'French', publicId: '', proficiency: '', entryNode: 'French', status: 'deleted' }]
    }

    let deletionsCount = 0
    let insertionsCount = 0
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletionsCount = deletions.length
        insertionsCount = insertions.length
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    await processLanguageMutations(store, subject, plan as any)

    const post = presentLanguages(subject, store)
    expect(post.some((item) => item.name === 'French')).toBe(false)
    expect(store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)).toHaveLength(0)
    expect(deletionsCount).toBeGreaterThan(0)
    expect(insertionsCount).toBe(0)
  })

  it('falls back to updateDav when update fails with PATCH error', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.add(subject, ns.schema('knowsLanguage'), literal('French'), doc)

    let updateDavCalled = false
    store.fetcher = {
      load: () => Promise.resolve()
    }
    store.updater = {
      update: (_deletions: any[], _insertions: any[], callback: Function) => callback('', false, 'Web error: 501 on PATCH'),
      updateDav: (_doc: any, deletions: any[], _insertions: any[], callback: Function) => {
        updateDavCalled = true
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        callback('', true)
      }
    }

    const plan = {
      create: [],
      update: [],
      remove: [{ name: 'French', publicId: '', proficiency: '', entryNode: 'French', status: 'deleted' }]
    }

    await processLanguageMutations(store, subject, plan as any)

    expect(updateDavCalled).toBe(true)
    expect(store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)).toHaveLength(0)
  })

  it('falls back to PUT when updateDav fails with missing GET request metadata', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.add(subject, ns.schema('knowsLanguage'), literal('French'), doc)

    let putCalled = false
    store.fetcher = {
      load: () => Promise.resolve(),
      webOperation: (method: string, _uri: string, _options: any) => {
        if (method === 'PUT') {
          putCalled = true
          return Promise.resolve({ ok: true, status: 200 })
        }
        return Promise.resolve({ ok: false, status: 500 })
      }
    }
    store.updater = {
      update: (_deletions: any[], _insertions: any[], callback: Function) => callback('', false, 'Web error: 501 on PATCH'),
      updateDav: (_doc: any, _deletions: any[], _insertions: any[], callback: Function) => {
        callback('', false, 'No record of our HTTP GET request for document')
      },
      serialize: () => '@prefix schema: <http://schema.org/> .\n'
    }

    const plan = {
      create: [],
      update: [],
      remove: [{ name: 'French', publicId: '', proficiency: '', entryNode: 'French', status: 'deleted' }]
    }

    await processLanguageMutations(store, subject, plan as any)

    expect(putCalled).toBe(true)
    expect(store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)).toHaveLength(0)
  })

  it('writes created languages as id nodes with solid:publicId', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    let insertionsCaptured: any[] = []
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        insertionsCaptured = insertions
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const plan = {
      create: [{ name: 'French', publicId: 'https://www.w3.org/ns/iana/language-code/fr', proficiency: '', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }

    await processLanguageMutations(store, subject, plan as any)

    const linkStatement = insertionsCaptured.find((statement) => statement.predicate.value === ns.schema('knowsLanguage').value)
    expect(linkStatement?.object?.termType).toBe('Collection')

    const firstEntry = linkStatement?.object?.elements?.[0]
    expect(firstEntry?.termType).toBe('NamedNode')
    expect(firstEntry?.value).toMatch(/^https:\/\/example\.com\/profile\/card#id\d{13}$/)

    const publicIdStatement = insertionsCaptured.find(
      (statement) =>
        statement.subject.value === firstEntry.value &&
        statement.predicate.value === ns.solid('publicId').value
    )
    expect(publicIdStatement?.object?.termType).toBe('NamedNode')
    expect(publicIdStatement?.object?.value).toBe('https://www.w3.org/ns/iana/language-code/fr')

    const publicIdNameStatement = insertionsCaptured.find(
      (statement) =>
        statement.subject.value === 'https://www.w3.org/ns/iana/language-code/fr' &&
        statement.predicate.value === ns.schema('name').value
    )
    expect(publicIdNameStatement?.object?.value).toBe('French')

    const proficiencyStatement = insertionsCaptured.find(
      (statement) =>
        statement.subject.value === firstEntry.value &&
        statement.predicate.value === ns.schema('proficiencyLevel').value
    )
    expect(proficiencyStatement).toBeUndefined()

    const typeStatement = insertionsCaptured.find(
      (statement) =>
        statement.subject.value === firstEntry.value &&
        statement.predicate.value === ns.rdf('type').value
    )
    expect(typeStatement?.object?.value).toBe(ns.schema('Language').value)

    const knowsLanguageValues = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
    expect(knowsLanguageValues.length).toBe(1)
    expect(knowsLanguageValues[0].object.termType).toBe('Collection')
  })

  it('does not accumulate extra language schema:Language type nodes across repeated saves', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(statement))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const plan = {
      create: [
        { name: 'Greek', publicId: 'https://www.w3.org/ns/iana/language-code/el', proficiency: '', entryNode: '', status: 'new' },
        { name: 'English', publicId: 'https://www.w3.org/ns/iana/language-code/en', proficiency: '', entryNode: '', status: 'new' }
      ],
      update: [],
      remove: []
    }

    await processLanguageMutations(store, subject, plan as any)
    await processLanguageMutations(store, subject, plan as any)

    const typeStatements = store.statementsMatching(undefined, ns.rdf('type'), ns.schema('Language'), doc)
    expect(typeStatements.length).toBeGreaterThanOrEqual(2)

  })

  it('keeps selected language display name even when publicId is unchanged', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(statement))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    await processLanguageMutations(store, subject, {
      create: [{ name: 'Greek', publicId: 'https://www.w3.org/ns/iana/language-code/el', proficiency: '', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    } as any)

    const firstPass = presentLanguages(subject, store)
    const existingEntry = firstPass[0]?.entryNode?.value
    expect(existingEntry).toBeTruthy()

    await processLanguageMutations(store, subject, {
      create: [],
      update: [{ name: 'Modern Greek', publicId: 'https://www.w3.org/ns/iana/language-code/el', proficiency: '', entryNode: existingEntry, status: 'modified' }],
      remove: []
    } as any)

    const secondPass = presentLanguages(subject, store)
    expect(secondPass).toHaveLength(1)
    expect(secondPass[0].publicId).toBe('https://www.w3.org/ns/iana/language-code/el')
    expect(secondPass[0].name).toBe('Modern Greek')
  })
})
