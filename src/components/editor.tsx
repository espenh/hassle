/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { debounce } from "lodash";

import * as React from "react";
import { IEditorParams } from "../contracts";

// TODO - We're adding some declarations here even if the scripts are (probably) not loaded.
// Could have an import screen where users could add scripts they want loaded (highcharts, react, lodash, jquery etc.)
// and have d.ts files paired with those libraries.
import * as defHighcharts from "!!raw-loader!@types/highcharts/index.d.ts";
import * as defReact from "!!raw-loader!@types/react/index.d.ts";

import TypeManager from "../typegeneration/typeManager";

export class MonacoEditor extends React.Component<IEditorParams, {}> {
    private editor: monaco.editor.IStandaloneCodeEditor;
    private editorElement: HTMLDivElement;
    private initWork: Promise<{}>;

    private loadedLibs: { dispose: () => void }[] = [];
    private hassleGeneratedTypeLibe: { dispose(): void } | undefined;

    private captureEditorContainer = (element: HTMLDivElement | null) => {
        if (element !== null) {
            this.editorElement = element;
        }
    }

    public render(): JSX.Element {
        return <div className="monaco-editor" ref={this.captureEditorContainer}></div >;
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
                        target: monaco.languages.typescript.ScriptTarget.ES2015,
                        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
                        module: monaco.languages.typescript.ModuleKind.CommonJS,
                        jsx: monaco.languages.typescript.JsxEmit.React,
                        allowNonTsExtensions: true,
                        noEmit: true,
                        typeRoots: ["node_modules/@types"],
                        strictNullChecks: false,
                        noImplicitAny: true
                    });

                    // Add some known types.
                    this.loadedLibs.push(monaco.languages.typescript.typescriptDefaults.addExtraLib(defReact as any, "node_modules/@types/react/index.d.ts"));
                    this.loadedLibs.push(monaco.languages.typescript.typescriptDefaults.addExtraLib(defHighcharts as any, "node_modules/@types/highcharts/index.d.ts"));

                    this.editor = monaco.editor.create(this.editorElement as HTMLDivElement, {
                        theme: "vs-dark",
                        model: monaco.editor.createModel(this.props.value, "typescript", monaco.Uri.parse("file:///main.tsx"))
                    });

                    const typeManager = new TypeManager();

                    const generateTypesForCurrentEditor = async () => {
                        const code = await this.getEditorText();
                        const generatedCode = await typeManager.processCode(code);

                        if (this.hassleGeneratedTypeLibe) {
                            this.hassleGeneratedTypeLibe.dispose();
                            this.hassleGeneratedTypeLibe = undefined;
                        }

                        this.hassleGeneratedTypeLibe = monaco.languages.typescript.typescriptDefaults.addExtraLib(generatedCode, "hassleGeneratedTypes.d.ts");
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

        if (this.hassleGeneratedTypeLibe) {
            this.hassleGeneratedTypeLibe.dispose();
            this.hassleGeneratedTypeLibe = undefined;
        }

        this.editor.getModel().dispose();
        this.editor.dispose();
    }
}
