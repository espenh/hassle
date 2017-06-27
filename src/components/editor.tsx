/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { debounce } from "lodash";

import * as React from "react";
import { IEditorParams } from "../contracts";

import * as defReact from "!!raw-loader!@types/react/index.d.ts";

export class MonacoEditor extends React.Component<IEditorParams, {}> {
    private editor: monaco.editor.IStandaloneCodeEditor;
    private editorElement: HTMLDivElement;
    private initWork: Promise<{}>;
    private loadedLibs: { dispose: () => void }[] = [];

    public render(): JSX.Element {
        return <div className="monaco-editor" ref={(element: HTMLDivElement) => { this.editorElement = element; }}></div >;
    }

    public componentDidMount() {
        // Monaco requires the AMD module loader to be present on the page. It is not yet
        // compatible with ES6 imports. Once that happens, we can get rid of this.
        // See https://github.com/Microsoft/monaco-editor/issues/18
        this.initWork = new Promise((resolve, reject) => {
            (window as any).require(["vs/editor/editor.main"], () => {
                if (this.props.language === "typescript") {
                    // TODO - Do this once. Could have multiple ts editors.
                    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                        target: monaco.languages.typescript.ScriptTarget.ES2016,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        allowNonTsExtensions: true,
                        noEmit: true,
                        typeRoots: ["node_modules/@types"],
                        strictNullChecks: false,
                        noImplicitAny: true
                    });

                    // Add known types.
                    try {
                        this.loadedLibs.push(monaco.languages.typescript.typescriptDefaults.addExtraLib(defReact as any, "node_modules/@types/react/index.d.ts"));
                    } catch (err) {
                        // TODO - We get an error if we add libs multiple times. Figure out how to clear the typescriptDefaults.
                    }

                    this.editor = monaco.editor.create(this.editorElement as HTMLDivElement, {
                        theme: "vs-dark",
                        model: monaco.editor.createModel(this.props.value, "typescript", monaco.Uri.parse("file:///main.tsx"))
                    });

                    const generateTypesForCurrentEditor = async () => {
                        // const code = await this.getEditorText();
                        // handler.processCode(code);
                    };

                    // Wire up change handling.
                    this.editor.getModel().onDidChangeContent(debounce(() => generateTypesForCurrentEditor(), 3000));

                    // Trigger initial generation.
                    generateTypesForCurrentEditor();

                } else {
                    // Css and html.
                    this.editor = monaco.editor.create(this.editorElement as HTMLDivElement, {
                        value: this.props.value,
                        language: this.props.language,
                        theme: "vs-dark"
                    });
                }

                this.editor.onDidChangeModelContent((event: any) => {
                    this.props.onChange(this.editor.getValue());
                });

                this.props.context.addResizeListener(() => {
                    this.editor.layout();
                });

                resolve();
            });
        });
    }

    public async getEditorText() {
        await this.initWork;
        return this.editor.getValue();
    }

    public componentWillUnmount() {
        this.loadedLibs.forEach((lib) => lib.dispose());
        this.loadedLibs = [];
        this.editor.getModel().dispose();
        this.editor.dispose();
    }
}
