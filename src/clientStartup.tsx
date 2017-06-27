import * as React from "react";
import * as ReactDOM from "react-dom";

import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import * as injectTapEventPlugin from "react-tap-event-plugin";
import HassleApp from "./components/app";

const loadRequiredMonacoEditorLibraries = () => {
    return new Promise((resolve) => {
        if (!(window as any).require) {
            const loaderScript = document.createElement("script");
            loaderScript.type = "text/javascript";
            loaderScript.src = "vs/loader.js";
            loaderScript.addEventListener("load", () => {
                resolve();
            });
            document.body.appendChild(loaderScript);
        } else {
            resolve();
        }
    });
};

window.addEventListener("load", async () => {
    const container = document.querySelector("#container") as HTMLDivElement;
    await loadRequiredMonacoEditorLibraries();

    // Needed for onTouchTap
    // http://stackoverflow.com/a/34015469/988941
    injectTapEventPlugin();

    ReactDOM.render(<MuiThemeProvider><HassleApp /></MuiThemeProvider>, container);
});
