import { afterEach, describe, expect, it, vi } from 'vitest'
import { html } from 'lit-html'
import { ProfileView } from '../src/ProfileView'
import pane from '../src/index'
import { openInputDialog } from '../src/ui/dialog'
import { context, subject } from './setup'

vi.mock('../src/ProfileView', () => ({
  ProfileView: vi.fn(async () => html`<section>Profile</section>`)
}))

vi.mock('../src/sections/qrcode/QRCodeCard', () => ({
  hydrateQRCodes: vi.fn(async () => undefined)
}))

vi.mock('../src/utils/resize', () => ({
  createResizeDrivenSync: vi.fn(() => () => undefined)
}))

afterEach(() => {
  document.body.replaceChildren()
  vi.clearAllMocks()
})

describe('profile save notifications', () => {
  it('notifies the host after a section save, but not during initial rendering', async () => {
    const saved = vi.fn()
    document.addEventListener('profile-pane-saved', saved)
    try {
      const target = pane.render(subject, context)
      document.body.appendChild(target)
      await vi.waitFor(() => expect(target.textContent).toBe('Profile'))
      expect(saved).not.toHaveBeenCalled()

      const onSaved = vi.mocked(ProfileView).mock.calls[0][3]
      expect(onSaved).toBeTypeOf('function')
      await onSaved?.()

      expect(saved).toHaveBeenCalledOnce()
      const event = saved.mock.calls[0][0] as CustomEvent<{ subjectUri: string }>
      expect(event.detail).toMatchObject({
        subjectUri: subject.value,
        profileData: { entryNode: subject }
      })
      expect(event.bubbles).toBe(true)
      expect(event.composed).toBe(true)
      expect(ProfileView).toHaveBeenCalledTimes(2)
    } finally {
      document.removeEventListener('profile-pane-saved', saved)
    }
  })

  it('rerenders when the host reports a heading save for the displayed profile', async () => {
    const saved = vi.fn()
    document.addEventListener('profile-pane-saved', saved)
    try {
      const target = pane.render(subject, context)
      document.body.appendChild(target)
      await vi.waitFor(() => expect(ProfileView).toHaveBeenCalledTimes(1))

      const announce = (subjectUri: string) => document.dispatchEvent(new CustomEvent('profile-heading-saved', {
        bubbles: true,
        composed: true,
        detail: { subjectUri }
      }))

      announce('https://another.example/profile/card#me')
      await Promise.resolve()
      expect(ProfileView).toHaveBeenCalledTimes(1)

      announce(subject.value)
      await vi.waitFor(() => expect(ProfileView).toHaveBeenCalledTimes(2))
      expect(saved).not.toHaveBeenCalled()

      target.remove()
      announce(subject.value)
      await Promise.resolve()
      expect(ProfileView).toHaveBeenCalledTimes(2)

      document.body.appendChild(target)
      announce(subject.value)
      await Promise.resolve()
      expect(ProfileView).toHaveBeenCalledTimes(2)
    } finally {
      document.removeEventListener('profile-pane-saved', saved)
    }
  })

  it('treats close-without-save as a no-op instead of a successful save', async () => {
    const form = document.createElement('form')
    form.innerHTML = '<input name="field" value="unchanged">'
    const onSave = vi.fn()

    const dialogPromise = openInputDialog({
      title: 'Edit profile',
      dom: document,
      form,
      shouldCloseWithoutSave: () => true,
      onSave
    })

    await vi.waitFor(() => {
      const saveButton = document.querySelector('#modal-buttons [data-dialog-primary="true"]') as HTMLElement | null
      expect(saveButton).not.toBeNull()
    })

    const saveButton = document.querySelector('#modal-buttons [data-dialog-primary="true"]') as HTMLElement
    saveButton.click()

    await expect(dialogPromise).resolves.toBeNull()
    expect(onSave).not.toHaveBeenCalled()
  })
})
