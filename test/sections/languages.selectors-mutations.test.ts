import { describe, expect, it } from "@jest/globals"
import { Collection, graph, literal, st, sym } from 'rdflib'
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

  it('reads canonical id-node list with solid publicId URI and schema name', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const id1 = sym('https://example.com/profile/card#id1')
    const id2 = sym('https://example.com/profile/card#id2')
    store.add(subject, ns.schema('knowsLanguage'), new Collection([
      id1,
      id2
    ]), doc)
    store.add(id1, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/en'), doc)
    store.add(id1, ns.schema('name'), literal('English'), doc)
    store.add(id2, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/es'), doc)
    store.add(id2, ns.schema('name'), literal('Spanish'), doc)

    const languages = presentLanguages(subject, store)
    expect(languages).toHaveLength(2)
    expect(languages.map((item) => item.name)).toEqual(['English', 'Spanish'])
    expect(languages.map((item) => item.publicId)).toEqual([
      'https://www.w3.org/ns/iana/language-code/en',
      'https://www.w3.org/ns/iana/language-code/es'
    ])
  })

  it('reads direct IANA URI list entries', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    store.add(subject, ns.schema('knowsLanguage'), new Collection([
      sym('https://www.w3.org/ns/iana/language-code/en'),
      sym('https://www.w3.org/ns/iana/language-code/es')
    ]), doc)

    const languages = presentLanguages(subject, store)
    expect(languages).toHaveLength(2)
    expect(languages.map((item) => item.publicId)).toEqual([
      'https://www.w3.org/ns/iana/language-code/en',
      'https://www.w3.org/ns/iana/language-code/es'
    ])
  })

  it('reads legacy entry-node list with solid:publicId literals', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const language1 = store.bnode()
    const language2 = store.bnode()

    store.add(subject, ns.schema('knowsLanguage'), new Collection([language1, language2]), doc)
    store.add(language1, ns.solid('publicId'), literal('fr'), doc)
    store.add(language2, ns.solid('publicId'), literal('de'), doc)

    const languages = presentLanguages(subject, store)
    expect(languages).toHaveLength(2)
    expect(languages.map((item) => item.publicId)).toEqual(['fr', 'de'])
  })

  it('reads cumulative legacy list snapshots and keeps longest ordered list', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const id1 = sym('https://example.com/profile/card#id1')
    const id2 = sym('https://example.com/profile/card#id2')
    const id3 = sym('https://example.com/profile/card#id3')

    store.add(subject, ns.schema('knowsLanguage'), new Collection([id1]), doc)
    store.add(subject, ns.schema('knowsLanguage'), new Collection([id1, id2]), doc)
    store.add(subject, ns.schema('knowsLanguage'), new Collection([id1, id2, id3]), doc)

    store.add(id1, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/en'), doc)
    store.add(id2, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/fr'), doc)
    store.add(id3, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/de'), doc)

    const languages = presentLanguages(subject, store)
    expect(languages).toHaveLength(3)
    expect(languages.map((item) => item.publicId)).toEqual([
      'https://www.w3.org/ns/iana/language-code/en',
      'https://www.w3.org/ns/iana/language-code/fr',
      'https://www.w3.org/ns/iana/language-code/de'
    ])
  })

  it('writes canonical id-node list model and removes legacy entry-node model statements', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const legacyEntry1 = sym('https://example.com/profile/card#id111')
    const legacyEntry2 = sym('https://example.com/profile/card#id222')

    store.add(subject, ns.schema('knowsLanguage'), new Collection([legacyEntry1]), doc)
    store.add(subject, ns.schema('knowsLanguage'), new Collection([legacyEntry1, legacyEntry2]), doc)
    store.add(legacyEntry1, ns.solid('publicId'), literal('fr'), doc)
    store.add(legacyEntry2, ns.solid('publicId'), sym('https://www.w3.org/ns/iana/language-code/de'), doc)
    store.add(legacyEntry1, ns.rdf('type'), ns.schema('Language'), doc)

    let insertionsCaptured: any[] = []
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        insertionsCaptured = insertions
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    await processLanguageMutations(
      store,
      subject,
      { create: [], update: [], remove: [] } as any,
      [
        { name: 'German', publicId: 'https://www.w3.org/ns/iana/language-code/de', proficiency: '', entryNode: '', status: 'existing' },
        { name: 'French', publicId: 'fr', proficiency: '', entryNode: '', status: 'existing' }
      ] as any
    )

    const knowsLanguageValues = store.statementsMatching(subject, ns.schema('knowsLanguage'), null, doc)
    expect(knowsLanguageValues).toHaveLength(1)
    expect(knowsLanguageValues[0].object.termType).toBe('Collection')

    const listElements = (knowsLanguageValues[0].object as any).elements || []
    expect(listElements).toHaveLength(2)
    expect(listElements.every((node: any) => node.termType === 'NamedNode')).toBe(true)
    expect(listElements.every((node: any) => node.value.includes('#id'))).toBe(true)

    const publicIdStatements = listElements.map((node: any) => {
      return store.any(node, ns.solid('publicId'), null, doc)
    })
    expect(publicIdStatements.map((node: any) => node?.value)).toEqual([
      'https://www.w3.org/ns/iana/language-code/de',
      'https://www.w3.org/ns/iana/language-code/fr'
    ])

    const nameStatements = listElements.map((node: any) => {
      return store.any(node, ns.schema('name'), null, doc)
    })
    expect(nameStatements.map((node: any) => node?.value)).toEqual(['German', 'French'])

    expect(insertionsCaptured.some((statement) => statement.predicate.value === ns.schema('knowsLanguage').value)).toBe(true)

    const legacyPublicIdLiteralStatements = store.statementsMatching(undefined, ns.solid('publicId'), literal('fr'), doc)
    expect(legacyPublicIdLiteralStatements).toHaveLength(0)
    expect(store.statementsMatching(legacyEntry1, ns.rdf('type'), ns.schema('Language'), doc)).toHaveLength(0)
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
})
