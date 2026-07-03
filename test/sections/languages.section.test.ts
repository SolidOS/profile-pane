import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderLanguageSection } from '../../src/sections/languages/LanguageSection'
import { runAxe } from '../helpers/runAxe'
import { context, subject } from '../setup'

describe('Languages section', () => {
  it('renders language entries', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const languages = [
      { name: 'English', proficiency: 'Fluent', entryNode: sym('https://example.com/profile#lang1') },
      { name: 'Spanish', proficiency: 'Intermediate', entryNode: sym('https://example.com/profile#lang2') }
    ]

    render(renderLanguageSection(context.session.store, subject, languages as any, 'owner', 'desktop'), container)

    expect(container.querySelector('#languages-heading')).toBeTruthy()
    expect(container.textContent).toContain('English')
    expect(container.textContent).toContain('Spanish')

    container.remove()
  })

  it('has no accessibility violations', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const languages = [
      { name: 'English', proficiency: 'Fluent', entryNode: sym('https://example.com/profile#lang1') },
      { name: 'Spanish', proficiency: 'Intermediate', entryNode: sym('https://example.com/profile#lang2') }
    ]

    render(renderLanguageSection(context.session.store, subject, languages as any, 'owner', 'desktop'), container)

    const results = await runAxe(container)
    expect(results.violations.length).toBe(0)

    container.remove()
  })

  it('uses the shared collapsible toggle and keeps the add more action', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const languages = [
      { name: 'English', proficiency: 'Fluent', entryNode: sym('https://example.com/profile#lang1') }
    ]

    render(renderLanguageSection(context.session.store, subject, languages as any, 'owner', 'desktop'), container)

    const section = container.querySelector('.profile-section-collapsible') as HTMLElement | null
    const toggleButton = container.querySelector('solid-ui-button[aria-controls="languages-panel"], button[aria-controls="languages-panel"]') as HTMLElement | null
    const panel = container.querySelector('#languages-panel') as HTMLElement | null
    const addMoreButton = container.querySelector('solid-ui-button.profile-section-collapsible__edit-button') as HTMLElement | null

    expect(section?.getAttribute('data-expanded')).toBe('false')
    expect(toggleButton?.getAttribute('aria-expanded')).toBe('false')
    expect(panel?.hidden).toBe(false)
    expect(panel?.getAttribute('aria-hidden')).toBeNull()
    expect(addMoreButton?.textContent).toContain('Add More')

    toggleButton?.click()

    expect(section?.getAttribute('data-expanded')).toBe('true')
    expect(toggleButton?.getAttribute('aria-expanded')).toBe('true')
    expect(panel?.getAttribute('aria-hidden')).toBe('false')

    toggleButton?.click()

    expect(section?.getAttribute('data-expanded')).toBe('false')
    expect(toggleButton?.getAttribute('aria-expanded')).toBe('false')
    expect(panel?.getAttribute('aria-hidden')).toBe('true')
    expect(panel?.hidden).toBe(true)

    container.remove()
  })
})
