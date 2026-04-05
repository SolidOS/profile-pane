import { describe, expect, it } from "@jest/globals"
import { render } from 'lit-html'
import { sym } from 'rdflib'
import { renderLanguageSection } from '../../src/sections/languages/LanguageSection'
import { context, subject } from '../setup'

describe('Languages section', () => {
  it('renders language entries', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const languages = [
      { name: 'English', proficiency: 'Fluent', entryNode: sym('https://example.com/profile#lang1') },
      { name: 'Spanish', proficiency: 'Intermediate', entryNode: sym('https://example.com/profile#lang2') }
    ]

    render(renderLanguageSection(context.session.store, subject, languages as any, 'owner'), container)

    expect(container.querySelector('#languages-heading')).toBeTruthy()
    expect(container.textContent).toContain('English')
    expect(container.textContent).toContain('Spanish')

    container.remove()
  })
})
