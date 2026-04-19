import { describe, expect, it } from "@jest/globals"
import { graph, st, sym, literal } from 'rdflib'
import { ns } from 'solid-ui'
import { presentSkills } from '../../src/sections/skills/selectors'
import { processSkillsMutations } from '../../src/sections/skills/mutations'
import { mutationSaveSkillsFailedPrefixText } from '../../src/texts'

describe('Skills selectors and mutations', () => {
  it('selector returns empty skills from empty store', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    expect(presentSkills(subject, store)).toEqual([])
  })

  it('selector reads names from publicId node when publicId is a skill: node', () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const skillEntry = sym(`${doc.value}#id1`)
    const skillPublicId = sym('skill:typescript')

    store.add(subject, ns.schema('skills'), skillEntry, doc)
    store.add(skillEntry, ns.solid('publicId'), skillPublicId, doc)
    store.add(skillPublicId, ns.schema('name'), 'TypeScript', doc)

    expect(presentSkills(subject, store)).toEqual(['TypeScript'])
  })

  it('mutation wraps updater errors with skills prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = {
      create: [{ name: 'TypeScript', publicId: 'skill:typescript', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }
    await expect(processSkillsMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveSkillsFailedPrefixText
    )
  })

  it('writes created skills with skill: node publicId and name on the publicId node', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()

    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const plan = {
      create: [{ name: 'TypeScript', publicId: 'http://data.europa.eu/esco/skill/typescript', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }

    await processSkillsMutations(store, subject, plan as any)

    const skillLinks = store.statementsMatching(subject, ns.schema('skills'), null, doc)
    expect(skillLinks).toHaveLength(1)

    const entryNode = skillLinks[0].object
    const publicIdLink = store.any(entryNode, ns.solid('publicId'), null, doc)
    expect(publicIdLink?.termType).toBe('NamedNode')
    expect(publicIdLink?.value).toBe('skill:typescript')

    const skillName = store.any(publicIdLink as any, ns.schema('name'), null, doc)
    expect(skillName?.value).toBe('TypeScript')

    const legacyNameOnEntry = store.any(entryNode, ns.schema('name'), null, doc)
    expect(legacyNameOnEntry).toBeNull()
  })

  it('deletes both skill entry triples and schema:skills pointer', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const entryNode = sym(`${doc.value}#id777`)

    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(st(statement.subject, statement.predicate, statement.object, statement.why)))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    store.add(subject, ns.schema('skills'), entryNode, doc)
    const publicIdNode = sym('skill:typescript')
    store.add(entryNode, ns.solid('publicId'), publicIdNode, doc)
    store.add(publicIdNode, ns.schema('name'), literal('TypeScript'), doc)

    const plan = {
      create: [],
      update: [],
      remove: [{ name: 'TypeScript', publicId: 'skill:typescript', entryNode: `${doc.value}#id777`, status: 'deleted' }]
    }

    await processSkillsMutations(store, subject, plan as any)

    expect(store.statementsMatching(subject, ns.schema('skills'), null, doc)).toHaveLength(0)
    expect(store.statementsMatching(entryNode, null, null, doc)).toHaveLength(0)
  })
})
