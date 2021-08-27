import * as $rdf from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";
import * as UI from "solid-ui";

const loginBanner = document.getElementById("loginBanner");
const webId = document.getElementById("webId");

const uri = "https://timea-test.solidcommunity.net";
//loginBanner.appendChild(UI.authn.loginStatusBox(document, null, {}));

if (!UI.authn.authSession.info.isLoggedIn) {
  // HACK This is a really ugly way to add a login box.
  // TODO make it prettier
  //loginBanner.appendChild(UI.authn.logIn(context));
  loginBanner.appendChild(UI.authn.loginStatusBox(document, uri => {
    alert("here")
  }, {}))
}
console.dir(UI.authn.authSession)
console.dir(window.localStorage)
 UI.authn.authSession.onLogin(() => {
  if (UI.authn.authSession.info.isLoggedIn) {
    webId.innerHTML = "Logged in as: " + UI.authn.authSession.info.webId;
    console.log(UI.authn.authSession.info.webId);
  }
}); 

/*UI.authn.authSession.onLogin(() => {
  loginBanner.innerHTML = '';
  loginBanner.appendChild(UI.authn.loginStatusBox(document, null, {}))
  // HACK doing this doesn't automatically refresh pages. But, it doesn't work
  // in the previous version of the data browser, so for now I'm moving on
  // To test this, navigate to a folder view, then log in. It will not automatically
  // redirect

})*/

UI.authn.authSession.onSessionRestore(() => {
  loginBanner.innerHTML = '';
  loginBanner.appendChild(UI.authn.loginStatusBox(document, null, {}))

});

// https://testingsolidos.solidcommunity.net/profile/card#me
// https://timbl.inrupt.net/profile/card#me
//
// const webIdToShow = "https://angelo.veltens.org/profile/card#me";
const webIdToShow = "https://testingsolidos.solidcommunity.net/profile/card#me";
// const webIdToShow = "https://timbl.inrupt.net/profile/card#me";

fetcher.load(webIdToShow).then(() => {
  const app = pane.render($rdf.sym(webIdToShow), context);
  document.getElementById("app").replaceWith(app);
});
