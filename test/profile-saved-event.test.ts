import { afterEach, describe, expect, it, vi } from 'vitest'
import { html } from 'lit-html'
import { ProfileView } from '../src/ProfileView'
import pane from '../src/index'
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
})
