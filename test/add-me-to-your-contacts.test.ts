import { context, subject } from './setup'
import pane from '../src'
import { findByText, fireEvent } from '@testing-library/dom'
import { logInAddMeToYourContactsButtonText, userNotLoggedInErrorMessage } from '../src/texts'

describe('add-me-to-your-contacts pane', () => {
  describe('saveNewContact with NO logged in user', () => {
    let result: HTMLElement

    beforeAll(() => {
      result = pane.render(subject, context)
    })

    it('renders the Add me to contacts button', async () => {
      const button = await findByText(result, logInAddMeToYourContactsButtonText.toUpperCase())
      expect(button).not.toBeNull()
    })

    it('saveNewContact with user NOT logged in', async () => {
      const button = await findByText(result, logInAddMeToYourContactsButtonText.toUpperCase())
      fireEvent.click(button)
      const errorMessage = await findByText(result, userNotLoggedInErrorMessage)
      expect(errorMessage).not.toBeNull()
    })
  })
})
