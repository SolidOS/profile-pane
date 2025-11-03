import { DataBrowserContext, PaneRegistry } from 'pane-registry'
import { sym } from 'rdflib'
import { SolidLogic, store } from 'solid-logic'

export const subject = sym('https://janedoe.example/profile/card#me')
export const doc = subject.doc()
/*
if (this && this.session && this.session.info && this.session.info.webId && this.session.info.isLoggedIn) 
{ return (0, rdflib_1.sym)(this.session.info.webId);

*/

export function fakeLogInAs (subject) {
    (window as any).$SolidTestEnvironment = {  // This affects the way the solidos stack work
        username: subject ? subject.value : null // assume logged in if not null
 }
 }

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
export const context = {
    dom: document,
    getOutliner: () => null,
    session: {
        info: {
            isLoggedIn: true,  // Added for editProofilepane
            webId: subject.value,
        },
        paneRegistry: {
            byName: (name: string) => {
                return {
                    render: () => {
                        return document.createElement('div')
                            .appendChild(
                                document.createTextNode(`mock ${name} pane`)
                            )
                    }
                }
            }
        } as PaneRegistry,
        store: store,
        logic: {} as SolidLogic,
    },
} as unknown as DataBrowserContext
