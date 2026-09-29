import { describe, expect, it } from 'vitest'
import { render } from 'lit-html'
import { literal, sym } from 'rdflib'
import { renderBioSection } from '../../src/sections/bio/BioSection'
import { renderProjectSection } from '../../src/sections/projects/ProjectSection'
import { renderSkillsSection } from '../../src/sections/skills/SkillsSection'
import { renderContactInfoSection } from '../../src/sections/contactInfo/ContactInfoSection'
import { renderEducationSection } from '../../src/sections/education/EducationSection'
import { renderCVSection } from '../../src/sections/resume/ResumeSection'
import { renderLanguageSection } from '../../src/sections/languages/LanguageSection'
import { renderSocialSection } from '../../src/sections/social/SocialSection'
import { runAxe } from '../helpers/runAxe'
import { context, subject } from '../setup'

describe('Section accessibility variants', () => {
  it('has no accessibility violations for owner empty states', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      renderBioSection(context.session.store, subject, { description: '', entryNode: '' } as any, 'owner', 'desktop'),
      container
    )
    render(renderProjectSection(context.session.store, subject, [], 'owner', 'desktop'), container)
    render(renderSkillsSection(context.session.store, subject, [], 'owner', 'desktop'), container)
    render(renderContactInfoSection(context.session.store, subject, { phones: [], emails: [], addresses: [] } as any, 'owner', 'desktop'), container)
    render(renderCVSection(context.session.store, subject, [], 'owner', 'desktop'), container)
    render(renderLanguageSection(context.session.store, subject, [], 'owner', 'desktop'), container)
    render(renderSocialSection(context.session.store as any, subject, { accounts: [] }, 'owner', 'desktop'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('has no accessibility violations for anonymous populated states', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const bio = { entryNode: sym('https://example.com/profile#bio'), description: 'Public bio content.' }
    const projects = [{ entryNode: sym('https://example.com/profile#project1'), url: 'https://example.com/project', title: 'Profile Pane', orgName: 'Open Source', category: 'project' }]
    const skills = [{ name: 'typescript', publicId: 'https://www.wikidata.org/wiki/Q978185', entryNode: sym('https://example.com/profile/card#skill-typescript') }]
    const contactInfo = {
      phones: [{ entryNode: sym('https://example.com/profile#phone'), type: sym('http://www.w3.org/2006/vcard/ns#Home'), valueNode: sym('tel:+1555123456') }],
      emails: [{ entryNode: sym('https://example.com/profile#email'), type: sym('http://www.w3.org/2006/vcard/ns#Work'), valueNode: sym('mailto:jane@example.com') }],
      addresses: [{ entryNode: sym('https://example.com/profile#address'), streetAddress: 'Main Street 1', locality: 'Boston', countryName: 'USA' }]
    }
    const educationData = [{ entryNode: sym('https://example.com/profile#edu1'), school: 'University of Amsterdam', degree: 'BSc Computer Science', location: 'Amsterdam', endDate: '2022-06-01', description: 'Focused on software engineering.' }]
    const roles = [{ entryNode: sym('https://example.com/profile#role1'), title: 'Software Engineer', orgName: 'SolidOS', orgLocation: 'Remote', startDate: literal('2021-01-01'), endDate: literal('2024-01-01'), description: 'Built profile pane features.' }]
    const languages = [{ name: 'English', proficiency: 'Fluent', entryNode: sym('https://example.com/profile#lang1') }]
    const social = { accounts: [{ entryNode: sym('https://example.com/profile/card#github'), homepage: 'https://github.com/example', name: 'GitHub', icon: 'https://example.com/github-icon.svg' }] }

    render(renderBioSection(context.session.store, subject, bio as any, 'anonymous', 'desktop'), container)
    render(renderProjectSection(context.session.store, subject, projects as any, 'anonymous', 'desktop'), container)
    render(renderSkillsSection(context.session.store, subject, skills as any, 'anonymous', 'desktop'), container)
    render(renderContactInfoSection(context.session.store, subject, contactInfo as any, 'anonymous', 'desktop'), container)
    render(renderEducationSection(context.session.store, subject, educationData as any, 'anonymous'), container)
    render(renderCVSection(context.session.store, subject, roles as any, 'anonymous', 'desktop'), container)
    render(renderLanguageSection(context.session.store, subject, languages as any, 'anonymous', 'desktop'), container)
    render(renderSocialSection(context.session.store as any, subject, social as any, 'anonymous', 'desktop'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })
})
