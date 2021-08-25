import {DataBrowserContext, PaneRegistry} from "pane-registry";
import {sym} from "rdflib";
import {SolidLogic} from "solid-logic";
import {store} from "solid-ui"

export const subject = sym("https://testingsolidos.solidcommunity.net/profile/card#me");
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
