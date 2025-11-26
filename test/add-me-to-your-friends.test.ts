import { context, subject } from './setup'
import pane from '../src'
import { fireEvent } from '@testing-library/dom'
import { logInAddMeToYourFriendsButtonText, userNotLoggedInErrorMessage } from '../src/texts'

describe('add-me-to-your-friends pane', () => {
  describe('saveNewFriend with NO logged in user', () => {
    let profileCard: HTMLElement | null
    beforeAll(() => {
      const result = pane.render(subject, context)
      const profileView = result.querySelector('profile-view')
      profileCard = profileView && profileView.shadowRoot
        ? profileView.shadowRoot.querySelector('profile-card')
        : null
    })

    it('renders the Add me to friends button', async () => {
      expect(profileCard).not.toBeNull()
      if (profileCard && profileCard.shadowRoot) {
        const button = Array.from(profileCard.shadowRoot.querySelectorAll('button')).find(
          btn => btn.textContent === logInAddMeToYourFriendsButtonText.toUpperCase()
        )
        expect(button).not.toBeNull()
      }
    })

    it('saveNewFriend with user NOT logged in', async () => {
      expect(profileCard).not.toBeNull()
      if (profileCard && profileCard.shadowRoot) {
        const button = Array.from(profileCard.shadowRoot.querySelectorAll('button')).find(
          btn => btn.textContent === logInAddMeToYourFriendsButtonText.toUpperCase()
        )
        expect(button).not.toBeNull()
        if (button) {
          fireEvent.click(button)
          // Error message is rendered in the same shadowRoot
          const errorMessage = Array.from(profileCard.shadowRoot.querySelectorAll('span, div')).find(
            el => el.textContent === userNotLoggedInErrorMessage
          )
          expect(errorMessage).not.toBeNull()
        }
      }
    })
  })
})

