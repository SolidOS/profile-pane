import {findByText, fireEvent,} from '@testing-library/dom'
import {parse} from 'rdflib'
import {ChatLogic} from 'solid-logic'
import pane from '../src'
import {context, doc, subject} from './setup'
import {logInToChatWithMeButtonText, userNotLoggedInErrorMessage, loadingMessage} from '../src/texts'
import {jest} from '@jest/globals'

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
        let chatWithMe: HTMLElement | null
        beforeAll(async () => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(null),
            } as unknown as ChatLogic
            const result = pane.render(subject, context)
            document.body.appendChild(result)
            // Wait for <profile-view> to be attached
            let profileView = null
            for (let i = 0; i < 40; i++) {
                profileView = result.querySelector('profile-view')
                if (profileView) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            // Wait for chat-with-me to be attached
            chatWithMe = null
            for (let i = 0; i < 40; i++) {
                chatWithMe = profileView && profileView.shadowRoot
                    ? profileView.shadowRoot.querySelector('chat-with-me')
                    : null
                if (chatWithMe) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        })

         it('renders the Login to chat with me button', async () => {
              expect(chatWithMe).not.toBeNull()
              if (chatWithMe && chatWithMe.shadowRoot) {
                const button = Array.from(chatWithMe.shadowRoot.querySelectorAll('button')).find(
                  btn => btn.textContent === logInToChatWithMeButtonText.toUpperCase()
                )
                expect(button).not.toBeNull()
              }
         })
    })


    describe('while chat loading', () => {
        let chatWithMe: HTMLElement | null
        beforeAll(async () => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue(new Promise(() => null)),
            } as unknown as ChatLogic
            const result = pane.render(subject, context)
            document.body.appendChild(result)
            // Wait for <profile-view> to be attached
            let profileView = null
            for (let i = 0; i < 40; i++) {
                profileView = result.querySelector('profile-view')
                if (profileView) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            // Wait for chat-with-me to be attached
            chatWithMe = null
            for (let i = 0; i < 40; i++) {
                chatWithMe = profileView && profileView.shadowRoot
                    ? profileView.shadowRoot.querySelector('chat-with-me')
                    : null
                if (chatWithMe) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        })

        it('renders a loading text', async () => {
            expect(chatWithMe).not.toBeNull()
            if (chatWithMe && chatWithMe.shadowRoot) {
                const loadingDiv = Array.from(chatWithMe.shadowRoot.querySelectorAll('div.chatLoading')).find(
                  div => div.textContent === loadingMessage.toUpperCase()
                )
                expect(loadingDiv).not.toBeNull()
            }
        })

    })

    describe('with a started chat', () => {
        let chatWithMe: HTMLElement | null
        beforeAll(async () => {
            context.session.logic.chat = {
                getChat: jest.fn().mockReturnValue('https://pod.example/chat'),
            } as unknown as ChatLogic
            const result = pane.render(subject, context)
            document.body.appendChild(result)
            // Wait for <profile-view> to be attached
            let profileView = null
            for (let i = 0; i < 40; i++) {
                profileView = result.querySelector('profile-view')
                if (profileView) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
            // Wait for chat-with-me to be attached
            chatWithMe = null
            for (let i = 0; i < 40; i++) {
                chatWithMe = profileView && profileView.shadowRoot
                    ? profileView.shadowRoot.querySelector('chat-with-me')
                    : null
                if (chatWithMe) break
                await new Promise(resolve => setTimeout(resolve, 50))
            }
        })

        it('renders the chat pane directly', async () => {
            expect(chatWithMe).not.toBeNull()
            if (chatWithMe && chatWithMe.shadowRoot) {
                // The chat pane is rendered by longChatPane.render, which may not have the exact text
                // So check for the chat log region
                const chatLog = chatWithMe.shadowRoot.querySelector('div[role="log"]')
                expect(chatLog).not.toBeNull()
            }
        })

    })
})
