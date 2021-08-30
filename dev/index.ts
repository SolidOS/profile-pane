import { sym } from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";
import { authn } from "solid-ui";

const loginBanner = document.getElementById("loginBanner");
const webId = document.getElementById("webId");

loginBanner.appendChild(authn.loginStatusBox(document, null, {}));

async function finishLogin() {
  await authn.authSession.handleIncomingRedirect();
  const session = authn.authSession;
  if (session.info.isLoggedIn) {
    // Update the page with the status.
    webId.innerHTML = "Logged in as: " + authn.currentUser().uri;
  } else {
    webId.innerHTML = "";
  }
}

finishLogin();


// https://testingsolidos.solidcommunity.net/profile/card#me
// https://timbl.inrupt.net/profile/card#me
//
// const webIdToShow = "https://angelo.veltens.org/profile/card#me";
const webIdToShow = "https://testingsolidos.solidcommunity.net/profile/card#me";
// const webIdToShow = "https://timbl.inrupt.net/profile/card#me";

fetcher.load(webIdToShow).then(() => {
  const app = pane.render(sym(webIdToShow), context);
  document.getElementById("app").replaceWith(app);
});
