import { context, subject } from './setup'
import pane from '../src'
import { findByText, fireEvent } from '@testing-library/dom'
import { logInAddMeToYourFriendsButtonText, userNotLoggedInErrorMessage } from '../src/texts'

// TODO(refactor): Revisit once Intro action area wiring is finalized.
describe.skip('add-me-to-your-friends pane', () => {
  describe('saveNewFriend with NO logged in user', () => {
    let result: HTMLElement
    beforeAll(() => {
      result = pane.render(subject, context)
    })

    it('renders the Add me to friends button', async () => {
      const button = await findByText(result, logInAddMeToYourFriendsButtonText.toUpperCase())
      expect(button).not.toBeNull()
    })

    it('saveNewFriend with user NOT logged in', async () => {
      const button = await findByText(result, logInAddMeToYourFriendsButtonText.toUpperCase())
      fireEvent.click(button)
      const errorMessage = await findByText(result, userNotLoggedInErrorMessage)
      expect(errorMessage).not.toBeNull() 
    })
  })
})

