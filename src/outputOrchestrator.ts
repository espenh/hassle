import * as _ from "lodash";

import { OutputFrame } from "./components/outputFrame";
import CompilerProxy from "./tsCompilerProxy";

export default class OutputOrchestrator {
    private outputFrame: OutputFrame | null;

    public readonly latestState: {
        css: string,
        html: string,
        typeScript: string,
        compiledJs: string
    };

    private throttleTimeInMilliseconds = 1000;

    private compiler: CompilerProxy;

    constructor() {
        this.outputFrame = null;
        this.latestState = {
            css: "",
            html: "",
            typeScript: "",
            compiledJs: ""
        };

        this.compiler = new CompilerProxy();
    }

    private throttledUpdated = _.debounce(() => {
        if (this.outputFrame === null) {
            throw new Error("Frame not ready yet.");
        }

        this.outputFrame.updateOutput({
            css: this.latestState.css,
            html: this.latestState.html,
            js: this.latestState.compiledJs
        });
    }, this.throttleTimeInMilliseconds);

    public setOutputFrame(outputFrame: OutputFrame) {
        this.outputFrame = outputFrame;
    }

    public update(code: Partial<{ typescript: string, css: string, html: string }>) {
        if (code.css !== undefined) {
            this.latestState.css = code.css;
        }

        if (code.html !== undefined) {
            this.latestState.html = code.html;
        }

        if (code.typescript !== undefined) {
            this.latestState.typeScript = code.typescript;

            const javascript = this.compiler.compile({
                code: code.typescript
            });

            this.latestState.compiledJs = javascript;
        }

        this.throttledUpdated();
    }
}
