import { sym } from "rdflib";
import { default as pane } from "../src";
import { context, fetcher } from "./context";
import { authn } from "solid-ui";

window.addEventListener("DOMContentLoaded", async () => {
  alert("whatever");
  const loginBanner = document.getElementById("loginBanner");
  rebuildHeader(loginBanner)();
  authn.authSession.onLogout(rebuildHeader(loginBanner));
  authn.authSession.onLogin(rebuildHeader(loginBanner));
});

function rebuildHeader(loginBanner: HTMLElement) {
  return async () => {
    const sessionInfo = authn.authSession.info;
    const user = sessionInfo.webId ? sym(sessionInfo.webId) : null;
    const webId = document.getElementById("webId");
    webId.innerHTML = sessionInfo.webId;
    await loginBanner.appendChild(authn.loginStatusBox(document, null, {}));
  };
}

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