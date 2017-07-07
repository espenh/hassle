import * as React from "react";
import { IEditorContext } from "../contracts";

export interface IOutputFrameProps {
    context: IEditorContext;
}

export interface IOutputFrameState {
    js: string;
    html: string;
    css: string;
}

export class OutputFrame extends React.Component<IOutputFrameProps, {}> {

    private containerElement: HTMLDivElement;

    public updateOutput(state: IOutputFrameState) {

        // Create iframe.
        const frame = this.containerElement.ownerDocument.createElement("iframe");
        frame.setAttribute("id", "hassle-iframe");
        frame.setAttribute("sandbox", "allow-forms allow-scripts allow-same-origin allow-modals allow-popups");

        frame.addEventListener("error", (e: ErrorEvent) => {
            alert(e.message);
        });

        // Set contents.
        const scriptElement = `<script type="text/javascript">\r\n${state.js}\r\n</script>`;
        const html = `<style type="text/css">\r\n${state.css}\r\n</style>\r\n${state.html}\r\n${scriptElement}`;
        frame.src = "data:text/html;charset=utf-8," + encodeURI(html);

        const existingIframe = this.containerElement.firstChild;
        if (existingIframe) {
            this.containerElement.replaceChild(frame, existingIframe);
        } else {
            this.containerElement.appendChild(frame);
        }
    }

    public render(): JSX.Element {
        return <div className="output-container" ref={(containerElement: HTMLDivElement) => { this.containerElement = containerElement; }}>
        </div>;
    }
}
