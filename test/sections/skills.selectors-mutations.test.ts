import { describe, expect, it } from "@jest/globals"
import { graph, st, sym } from 'rdflib'
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

  it('mutation wraps updater errors with skills prefix', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')

    const plan = {
      create: [{ name: 'TypeScript', publicId: 'http://data.europa.eu/esco/skill/typescript', entryNode: '', status: 'new' }],
      update: [],
      remove: []
    }
    await expect(processSkillsMutations(store, subject, plan as any)).rejects.toThrow(
      mutationSaveSkillsFailedPrefixText
    )
  })

  it('writes created skills with solid:publicId and keeps type/name on the skill entry node', async () => {
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
    expect(publicIdLink?.value).toBe('http://data.europa.eu/esco/skill/typescript')

    const skillName = store.any(entryNode, ns.schema('name'), null, doc)
    expect(skillName?.value).toBe('TypeScript')

    const skillType = store.any(entryNode, ns.rdf('type'), null, doc)
    expect(skillType?.value).toBe(ns.schema('Skill').value)
  })
})
