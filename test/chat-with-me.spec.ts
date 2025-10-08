import {findByText, fireEvent,} from '@testing-library/dom'
import {parse} from 'rdflib'
import {ChatLogic} from 'solid-logic'
import pane from '../src'
import {context, doc, subject} from './setup'
import {logInToChatWithMeButtonText, userNotLoggedInErrorMessage, loadingMessage} from '../src/texts'

describe('chat with me', () => {

    beforeAll(() => {
        context.session.store.removeDocument(doc)
        const turtle = `
      @prefix : <#>.
      @prefix foaf: <http://xmlns.com/foaf/0.1/> .
      @prefix vcard: <http://www.w3.org/2006/vcard/ns#> .
      :me foaf:name "Jane Doe";
      .
  `
        parse(turtle, context.session.store, doc.uri)
    })

    describe('without a started chat and not logged in', () => {
        let result: HTMLElement
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(null),
            } as unknown as ChatLogic
            result = pane.render(subject, context)
        })

         it('renders the Login to chat with me button', async () => {
              const button = await findByText(result, logInToChatWithMeButtonText.toUpperCase())
              expect(button).not.toBeNull()
         })

    })


    describe('while chat loading', () => {
        let result: HTMLElement
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(new Promise(() => null)),
            } as unknown as ChatLogic
            result = pane.render(subject, context)
        })

        it('renders a loading text', async () => {
            const button = await findByText(result, loadingMessage.toUpperCase())
            expect(button).not.toBeNull()
        })

    })

    describe('with a started chat', () => {
        let result: HTMLElement
        beforeAll(() => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue('https://pod.example/chat'),
            } as unknown as ChatLogic
            result = pane.render(subject, context)
        })

        it('renders the chat pane directly', async () => {
            const chatPane = await findByText(result,'mock long chat pane')
            expect(chatPane).not.toBeNull()
        })

    })
})
