

// https://stackoverflow.com/questions/68468203/why-am-i-getting-textencoder-is-not-defined-in-jest
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
console.log(' @@@ TextDecoder TextDecoder TextDecoder TextDecoder TextDecoder: ', TextDecoder)
const fooBar = new TextEncoder()

import { DataBrowserContext, PaneRegistry } from "pane-registry";
// import { sym } from "rdflib";
import { SolidLogic, store } from "solid-logic";



export const subject = store.sym("https://janedoe.example/profile/card#me");
export const doc = subject.doc();

export const context = {
    dom: document,
    getOutliner: () => null,
    session: {
        paneRegistry: {
            byName: (name: string) => {
                return {
                    render: () => {
                        return document.createElement('div')
                            .appendChild(
                                document.createTextNode(`mock ${name} pane`)
                            );
                    }
                }
            }
        } as PaneRegistry,
        store,
        logic: {} as SolidLogic,
    },
} as unknown as DataBrowserContext;
