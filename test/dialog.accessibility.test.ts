import { describe, expect, it } from '@jest/globals'
import { graph, sym } from 'rdflib'
import { ns } from 'solid-ui'
import { createLanguageEditDialog } from '../src/sections/languages/LanguageEditDialog'
import { createResumeEditDialog } from '../src/sections/resume/ResumeEditDialog'
import { createSkillsEditDialog } from '../src/sections/skills/SkillsEditDialog'
import { createSocialEditDialog } from '../src/sections/social/SocialEditDialog'
import { getSharedDialogCancelButton, getSharedDialogSaveButton, openInputDialog } from '../src/ui/dialog'
import { runAxe } from './helpers/runAxe'

async function waitForFrame(): Promise<void> {
  await new Promise<void>((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve())
      return
    }

    setTimeout(resolve, 0)
  })
}

async function waitForDialogFocus(): Promise<void> {
  await waitForFrame()
  await waitForFrame()
  await waitForFrame()
}

describe('Dialog accessibility', () => {
  it('mounts the shared dialog on the document body', async () => {
    const paneRoot = document.createElement('div')
    paneRoot.className = 'profile-pane-root'
    document.body.appendChild(paneRoot)

    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)
    paneRoot.appendChild(form)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    const dialog = document.body.querySelector(':scope > #profile-modal') as HTMLDialogElement | null
    expect(dialog).not.toBeNull()
    expect(paneRoot.querySelector(':scope > #profile-modal')).toBeNull()

    getSharedDialogCancelButton(document)?.click()
    await expect(resultPromise).resolves.toBeNull()
  })

  it('has no accessibility violations for the shared input dialog', async () => {
    const form = document.createElement('form')
    const label = document.createElement('label')
    label.textContent = 'Display name'
    const input = document.createElement('input')
    input.name = 'displayName'
    label.appendChild(input)
    form.appendChild(label)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    const dialog = document.querySelector('#profile-modal') as HTMLDialogElement | null
    expect(dialog).not.toBeNull()

    const results = await runAxe(document.body)
    expect(results.violations.length).toBe(0)

    const cancelButton = getSharedDialogCancelButton(document)
    cancelButton?.click()

    await expect(resultPromise).resolves.toBeNull()
  })

  it('keeps the submit label singular after a failed save attempt', async () => {
    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' },
      onSave: async () => {
        throw new Error('Save failed')
      }
    })

    const saveButton = getSharedDialogSaveButton(document)
    expect(saveButton?.textContent).toBe('Save Changes')

    saveButton?.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    const errorSection = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorSection).not.toBeNull()
    expect(errorSection?.getAttribute('role')).toBe('alert')
    expect(errorSection?.getAttribute('aria-live')).toBe('assertive')
    expect(errorSection?.getAttribute('aria-atomic')).toBe('true')
    expect(errorSection?.getAttribute('aria-hidden')).toBe('false')

    expect(saveButton?.textContent).toBe('Save Changes')

    const cancelButton = getSharedDialogCancelButton(document)
    cancelButton?.click()

    await expect(resultPromise).resolves.toBeNull()
  })

  it('announces validation errors accessibly and remains axe-clean while visible', async () => {
    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' },
      validate: () => 'Display name is required.'
    })

    const saveButton = getSharedDialogSaveButton(document)
    saveButton?.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    const errorSection = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorSection).not.toBeNull()
    expect(errorSection?.textContent).toBe('Display name is required.')
    expect(errorSection?.getAttribute('role')).toBe('alert')
    expect(errorSection?.getAttribute('aria-live')).toBe('assertive')
    expect(errorSection?.getAttribute('aria-atomic')).toBe('true')
    expect(errorSection?.getAttribute('aria-hidden')).toBe('false')

    const results = await runAxe(document.body)
    expect(results.violations.length).toBe(0)

    getSharedDialogCancelButton(document)?.click()
    await expect(resultPromise).resolves.toBeNull()
  })

  it('announces save errors accessibly and remains axe-clean while visible', async () => {
    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' },
      onSave: async () => {
        throw new Error('Save failed')
      }
    })

    getSharedDialogSaveButton(document)?.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    const errorSection = document.querySelector('#modal-error') as HTMLElement | null
    expect(errorSection).not.toBeNull()
    expect(errorSection?.textContent).toBe('Save failed')
    expect(errorSection?.getAttribute('role')).toBe('alert')
    expect(errorSection?.getAttribute('aria-live')).toBe('assertive')
    expect(errorSection?.getAttribute('aria-atomic')).toBe('true')
    expect(errorSection?.getAttribute('aria-hidden')).toBe('false')

    const results = await runAxe(document.body)
    expect(results.violations.length).toBe(0)

    getSharedDialogCancelButton(document)?.click()
    await expect(resultPromise).resolves.toBeNull()
  })

  it('makes the dialog body inert while save is in progress', async () => {
    let resolveSave: (() => void) | undefined

    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' },
      onSave: () => new Promise<void>((resolve) => {
        resolveSave = resolve
      })
    })

    input.focus()

    const dialog = document.querySelector('#profile-modal') as HTMLDialogElement | null
    const description = document.querySelector('#modal-desc') as HTMLDivElement | null
    const overlay = document.querySelector('#modal-saving-overlay') as HTMLDivElement | null
    const saveButton = getSharedDialogSaveButton(document)

    saveButton?.click()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(dialog?.classList.contains('modal--saving')).toBe(true)
    expect(dialog?.getAttribute('aria-busy')).toBe('true')
    expect(description?.hasAttribute('inert')).toBe(true)
    expect(document.activeElement).not.toBe(input)
    expect(overlay?.hidden).toBe(false)

    if (resolveSave) {
      resolveSave()
    }
    await expect(resultPromise).resolves.toEqual({ displayName: '' })
  })

  it('moves focus to the first field after opening on desktop layouts', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.appendChild(trigger)
    trigger.focus()

    const form = document.createElement('form')
    const label = document.createElement('label')
    label.textContent = 'Display name'
    const input = document.createElement('input')
    input.name = 'displayName'
    label.appendChild(input)
    form.appendChild(label)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    const dialog = document.querySelector('#profile-modal') as HTMLDialogElement | null
    expect(dialog).not.toBeNull()

    await waitForDialogFocus()
    expect(document.activeElement).toBe(input)

    const cancelEvent = new Event('cancel', { bubbles: false, cancelable: true })
    dialog?.dispatchEvent(cancelEvent)

    await expect(resultPromise).resolves.toBeNull()
  })

  it('does not programmatically move focus on open or cancel in mobile layouts', async () => {
    const mobileLayout = document.createElement('div')
    mobileLayout.setAttribute('data-layout', 'mobile')
    document.body.appendChild(mobileLayout)
    try {
      const trigger = document.createElement('button')
      trigger.textContent = 'Open dialog'
      document.body.appendChild(trigger)
      trigger.focus()

      const form = document.createElement('form')
      const label = document.createElement('label')
      label.textContent = 'Display name'
      const input = document.createElement('input')
      input.name = 'displayName'
      label.appendChild(input)
      form.appendChild(label)

      const resultPromise = openInputDialog({
        title: 'Edit display name',
        dom: document,
        form,
        headerAction: { type: 'none' }
      })

      const dialog = document.querySelector('#profile-modal') as HTMLDialogElement | null
      expect(dialog).not.toBeNull()

      await waitForDialogFocus()
      expect(document.activeElement).toBe(trigger)

      const cancelEvent = new Event('cancel', { bubbles: false, cancelable: true })
      dialog?.dispatchEvent(cancelEvent)

      await expect(resultPromise).resolves.toBeNull()
      expect(document.activeElement).toBe(trigger)
    } finally {
      mobileLayout.remove()
    }
  })

  it('locks document scrolling while the shared dialog is open without changing body positioning', async () => {
    document.documentElement.style.overflow = 'auto'
    document.body.style.overflow = 'scroll'
    document.body.style.position = 'relative'
    document.body.style.top = '3px'
    document.body.style.left = '4px'
    document.body.style.right = '5px'
    document.body.style.width = '80%'

    const scrollTo = jest.fn()
    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      value: scrollTo
    })

    const form = document.createElement('form')
    const input = document.createElement('input')
    input.name = 'displayName'
    form.appendChild(input)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.position).toBe('relative')
    expect(document.body.style.top).toBe('3px')
    expect(document.body.style.left).toBe('4px')
    expect(document.body.style.right).toBe('5px')
    expect(document.body.style.width).toBe('80%')

    getSharedDialogCancelButton(document)?.click()
    await expect(resultPromise).resolves.toBeNull()

    expect(document.documentElement.style.overflow).toBe('auto')
    expect(document.body.style.overflow).toBe('scroll')
    expect(document.body.style.position).toBe('relative')
    expect(document.body.style.top).toBe('3px')
    expect(document.body.style.left).toBe('4px')
    expect(document.body.style.right).toBe('5px')
    expect(document.body.style.width).toBe('80%')
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('allows wheel events from dialog content rendered inside shadow DOM', async () => {
    const form = document.createElement('form')
    const host = document.createElement('div')
    const shadowRoot = host.attachShadow({ mode: 'open' })
    const shadowScroller = document.createElement('div')
    shadowScroller.textContent = 'Scrollable dialog content'
    shadowRoot.appendChild(shadowScroller)
    form.appendChild(host)

    const resultPromise = openInputDialog({
      title: 'Edit display name',
      dom: document,
      form,
      headerAction: { type: 'none' }
    })

    const wheelEvent = new Event('wheel', {
      bubbles: true,
      cancelable: true,
      composed: true
    })

    shadowScroller.dispatchEvent(wheelEvent)

    expect(wheelEvent.defaultPrevented).toBe(false)

    getSharedDialogCancelButton(document)?.click()
    await expect(resultPromise).resolves.toBeNull()
  })

  it('opens social, skills, and language dialogs with focus on the first field while keeping popups closed', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.appendChild(trigger)

    const socialPromise = createSocialEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner'
    )

    await waitForDialogFocus()

    const socialHomepageInput = document.querySelector('[name="social-homepage-0"]') as HTMLInputElement | null
    const socialSelect = document.querySelector('solid-ui-select[data-social-account-row-index="0"]') as HTMLElement | null
    expect(socialHomepageInput).not.toBeNull()
    expect(socialSelect).not.toBeNull()
    expect([socialHomepageInput, socialSelect]).toContain(document.activeElement)
    expect(socialSelect?.hasAttribute('popup-open')).toBe(false)

    getSharedDialogCancelButton(document)?.click()
    await expect(socialPromise).resolves.toBeUndefined()

    const skillsPromise = createSkillsEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner'
    )

    await waitForDialogFocus()

    const skillsCombobox = document.querySelector('solid-ui-combobox[data-skill-row-index="0"]') as HTMLElement | null
    expect(skillsCombobox).not.toBeNull()
    expect(skillsCombobox?.shadowRoot?.activeElement?.tagName).toBe('INPUT')
    expect(skillsCombobox?.hasAttribute('popup-open')).toBe(false)

    getSharedDialogCancelButton(document)?.click()
    await expect(skillsPromise).resolves.toBeUndefined()

    const languagePromise = createLanguageEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner'
    )

    await waitForDialogFocus()

    const languageCombobox = document.querySelector('solid-ui-combobox[data-language-row-index="0"]') as HTMLElement | null
    expect(languageCombobox).not.toBeNull()
    expect(languageCombobox?.shadowRoot?.activeElement?.tagName).toBe('INPUT')
    expect(languageCombobox?.hasAttribute('popup-open')).toBe(false)

    getSharedDialogCancelButton(document)?.click()
    await expect(languagePromise).resolves.toBeUndefined()
  })

  it('treats typed custom skills as changes and saves them from the dialog', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.appendChild(trigger)

    store.fetcher = {
      load: async () => undefined
    }
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(statement.subject, statement.predicate, statement.object, statement.why))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const skillsPromise = createSkillsEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner'
    )

    await waitForDialogFocus()

    const skillsCombobox = document.querySelector('solid-ui-combobox[data-skill-row-index="0"]') as HTMLElement | null
    const skillsInput = skillsCombobox?.shadowRoot?.querySelector('input') as HTMLInputElement | null
    expect(skillsInput).not.toBeNull()

    skillsInput!.value = 'Facilitation'
    skillsInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    await waitForDialogFocus()

    getSharedDialogSaveButton(document)?.click()
    await expect(skillsPromise).resolves.toBeUndefined()

    const skillLinks = store.statementsMatching(subject, ns.schema('skills'), null, doc)
    expect(skillLinks).toHaveLength(1)

    const entryNode = skillLinks[0].object
    const publicIdLink = store.any(entryNode, ns.solid('publicId'), null, doc)
    expect(publicIdLink?.termType).toBe('BlankNode')

    const skillName = store.any(publicIdLink as any, ns.schema('name'), null, doc)
    expect(skillName?.value).toBe('Facilitation')
  })

  it('keeps a typed custom skill when using Add More before saving', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.appendChild(trigger)

    store.fetcher = {
      load: async () => undefined
    }
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(statement.subject, statement.predicate, statement.object, statement.why))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const skillsPromise = createSkillsEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner'
    )

    await waitForDialogFocus()

    const firstSkillsCombobox = document.querySelector('solid-ui-combobox[data-skill-row-index="0"]') as HTMLElement | null
    const firstSkillsInput = firstSkillsCombobox?.shadowRoot?.querySelector('input') as HTMLInputElement | null
    expect(firstSkillsInput).not.toBeNull()

    firstSkillsInput!.value = 'Facilitation'
    firstSkillsInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    const addMoreButton = document.querySelector('#modal-header-action solid-ui-button') as HTMLElement | null
    expect(addMoreButton).not.toBeNull()
    addMoreButton?.click()

    await waitForDialogFocus()

    const preservedCombobox = document.querySelector('solid-ui-combobox[data-skill-row-index="1"]') as HTMLElement | null
    const preservedInput = preservedCombobox?.shadowRoot?.querySelector('input') as HTMLInputElement | null
    expect(preservedInput?.value).toBe('Facilitation')

    getSharedDialogSaveButton(document)?.click()
    await expect(skillsPromise).resolves.toBeUndefined()

    const skillLinks = store.statementsMatching(subject, ns.schema('skills'), null, doc)
    expect(skillLinks).toHaveLength(1)

    const entryNode = skillLinks[0].object
    const publicIdLink = store.any(entryNode, ns.solid('publicId'), null, doc)
    const skillName = store.any(publicIdLink as any, ns.schema('name'), null, doc)
    expect(skillName?.value).toBe('Facilitation')
  })

  it('treats typed custom resume organizations as changes and saves them from the dialog', async () => {
    const store = graph() as any
    const subject = sym('https://example.com/profile/card#me')
    const doc = subject.doc()
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.appendChild(trigger)

    store.fetcher = {
      load: async () => undefined
    }
    store.updater = {
      update: (deletions: any[], insertions: any[], callback: Function) => {
        deletions.forEach((statement) => store.remove(statement.subject, statement.predicate, statement.object, statement.why))
        insertions.forEach((statement) => store.add(statement.subject, statement.predicate, statement.object, statement.why))
        callback('', true)
      }
    }

    const resumePromise = createResumeEditDialog(
      { currentTarget: trigger } as unknown as Event,
      store,
      subject,
      [],
      'owner',
      async () => undefined
    )

    await waitForDialogFocus()

    const titleInput = document.querySelector('[name="resume-title-0"]') as HTMLInputElement | null
    const organizationCombobox = document.querySelector('solid-ui-combobox[data-resume-organization-index="0"]') as HTMLElement | null
    const organizationInput = organizationCombobox?.shadowRoot?.querySelector('input') as HTMLInputElement | null
    const currentRoleCheckbox = document.querySelector('#resume-current-role-0') as HTMLInputElement | null
    expect(titleInput).not.toBeNull()
    expect(organizationInput).not.toBeNull()
    expect(currentRoleCheckbox).not.toBeNull()

    titleInput!.value = 'Engineer'
    titleInput!.dispatchEvent(new Event('change', { bubbles: true }))

    currentRoleCheckbox!.checked = true
    currentRoleCheckbox!.dispatchEvent(new Event('change', { bubbles: true }))

    organizationInput!.value = 'N'
    organizationInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    await waitForDialogFocus()

    const refreshedOrganizationCombobox = document.querySelector('solid-ui-combobox[data-resume-organization-index="0"]') as HTMLElement & {
      value?: string
      inputValue?: string
      shadowRoot?: ShadowRoot | null
    } | null
    const refreshedOrganizationInput = refreshedOrganizationCombobox?.shadowRoot?.querySelector('input') as HTMLInputElement | null
    expect(refreshedOrganizationInput?.value).toBe('N')

    refreshedOrganizationInput!.value = 'NASA'
    refreshedOrganizationInput!.dispatchEvent(new Event('input', { bubbles: true, composed: true }))

    if (refreshedOrganizationCombobox) {
      refreshedOrganizationCombobox.value = ''
      refreshedOrganizationCombobox.inputValue = 'NASA'
    }

    if (refreshedOrganizationInput) {
      refreshedOrganizationInput.value = 'NASA'
    }

    getSharedDialogSaveButton(document)?.click()
    await expect(resumePromise).resolves.toBeUndefined()

    const membershipLinks = store.statementsMatching(null, ns.org('member'), subject, doc)
    expect(membershipLinks.length).toBeGreaterThan(0)

    const membershipNode = membershipLinks[0].subject
    const organizationNode = store.any(membershipNode as any, ns.org('organization'), null, doc)
    expect(organizationNode).toBeTruthy()

    const organizationName = store.any(organizationNode as any, ns.schema('name'), null, doc)
    expect(organizationName?.value).toBe('NASA')
  })
})
