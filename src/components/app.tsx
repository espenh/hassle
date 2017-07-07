import { defaults, each, flatten, map } from "lodash";

import * as GoldenLayout from "golden-layout";
import * as React from "react";
import * as ReactDOM from "react-dom";

import { IEditorContext, IEditorParams } from "../contracts";
import { MonacoEditor } from "./editor";
import { IOutputFrameProps, OutputFrame } from "./outputFrame";

import { AppBar, CircularProgress, IconButton, IconMenu, MenuItem, Snackbar, } from "material-ui";
import Divider from "material-ui/Divider";
import CodeIcon from "material-ui/svg-icons/action/code";
import SaveIcon from "material-ui/svg-icons/content/save";

import getMuiTheme from "material-ui/styles/getMuiTheme";
import MoreVertIcon from "material-ui/svg-icons/navigation/more-vert";

import "style-loader!golden-layout/src/css/goldenlayout-base.css";
import "style-loader!golden-layout/src/css/goldenlayout-dark-theme.css";
import HashHandler from "../hashHandler";
import HassleApiService from "../hassleApiService";
import OutputOrchestrator from "../outputOrchestrator";
import { OptionsFrame } from "./optionsFrame";
import SaveDialog from "./saveDialog";

interface ISnackBarState {
    open: boolean;
    message?: string;
    highlightedMessage?: string;
}

interface IHassleAppState {
    snackBar: ISnackBarState;
    saveDialog: {
        open: boolean;
    };
    isLoading: boolean;
}

export default class HassleApp extends React.Component<{}, IHassleAppState> {
    private readonly hashHandler: HashHandler;
    private readonly outputHandler: OutputOrchestrator;
    private readonly hassleApi: HassleApiService;

    private myLayout: GoldenLayout;
    private container: HTMLDivElement;

    constructor(props: {}) {
        super(props);

        this.state = {
            snackBar: {
                open: false
            },
            saveDialog: {
                open: false
            },
            isLoading: false
        };

        this.hassleApi = new HassleApiService();
        this.outputHandler = new OutputOrchestrator();
        this.hashHandler = new HashHandler((hash) => {
            this.setState({ snackBar: { open: false } });
            this.loadScenarioFromFriendlyHash(hash);
        });
    }

    public async loadScenarioFromFriendlyHash(hash: string) {
        this.setState({ isLoading: true });
        const response = await this.hassleApi.getScenario(hash);
        this.setState({ isLoading: false });

        if (response.success) {
            const layoutOptions = JSON.parse(response.data.Scenario.LayoutJson) as GoldenLayout.Config;

            this.initLayout(this.container, layoutOptions, {
                typescript: response.data.Scenario.Code.TypeScript,
                css: response.data.Scenario.Code.Css,
                html: response.data.Scenario.Code.Html
            });

        } else {
            this.setState({
                snackBar: {
                    open: true,
                    message: `Error loading scenario: ${hash}. Status: ${response.message}`
                }
            });

            this.initLayout(this.container, {});
        }
    }

    public render() {
        const palette = getMuiTheme().palette;
        const highlightColor = palette ? palette.accent1Color : "red";

        return <div className="app-container">
            <AppBar
                title="Hassle"
                showMenuIconButton={false}
                iconElementRight={<IconMenu
                    iconButtonElement={
                        <IconButton><MoreVertIcon /></IconButton>
                    }
                    targetOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "top" }}>
                    <MenuItem primaryText="Save" leftIcon={<SaveIcon />} disabled={this.state.isLoading} onClick={async () => {
                        this.setState({
                            saveDialog: {
                                open: true
                            }
                        });
                    }} />
                    <Divider />
                    <MenuItem primaryText="GitHub" leftIcon={<CodeIcon />} target="_blank" href="https://github.com/espenh/hassle" />
                </IconMenu>} />
            {this.state.isLoading && <CircularProgress style={{ position: "fixed", left: 0, right: 0, top: 0, bottom: 0, margin: "auto", zoom: 2, opacity: 0.5, zIndex: 1000000 }} />}
            <SaveDialog
                isOpen={this.state.saveDialog.open}
                initialValue={this.hashHandler.getCurrentHash()}
                onRequestClose={() => {
                    this.setState({
                        saveDialog: {
                            open: false
                        }
                    });
                }}
                onSaveRequested={async (friendlyName: string | null) => {
                    this.setState({
                        saveDialog: {
                            open: false
                        }
                    });

                    const layoutConfig = this.myLayout.toConfig();

                    this.setState({ isLoading: true });
                    const response = await this.hassleApi.saveScenario(friendlyName, layoutConfig, this.outputHandler.latestState);
                    this.setState({ isLoading: false });

                    if (response.success) {
                        this.setState({
                            snackBar: {
                                open: true,
                                message: "Scenario saved as ",
                                highlightedMessage: `#${response.data.FriendlyHash}`
                            }
                        });

                        this.hashHandler.setStateWithoutEventing(response.data.FriendlyHash);
                    } else {
                        this.setState({
                            snackBar: {
                                open: true,
                                message: `Error saving scenario: ${response.message}`
                            }
                        });
                    }
                }} />
            <Snackbar
                open={this.state.snackBar.open}
                message={
                    <span style={{ display: "flex", alignItems: "center" }}>{this.state.snackBar.message}
                        {this.state.snackBar.highlightedMessage !== undefined && <b style={{ color: highlightColor, fontSize: "1.4em", marginLeft: "5px" }}>{this.state.snackBar.highlightedMessage}</b>}
                    </span>
                }
                autoHideDuration={4000}
                onRequestClose={() => this.setState({ snackBar: { open: false } })}
            />
            <div className="layout-container" ref={(element: HTMLDivElement) => { this.container = element; }}></div>
        </div >;
    }

    public componentDidMount() {
        // TODO - GoldenLayout depends on these globals being set.
        (window as any).React = React;
        (window as any).ReactDOM = ReactDOM;

        const startupHash = this.hashHandler.getCurrentHash();
        if (startupHash) {
            this.loadScenarioFromFriendlyHash(startupHash);
        } else {
            this.initLayout(this.container, {});
        }
    }

    private initLayout(container: HTMLElement, partialConfig: GoldenLayout.Config | {}, code?: { typescript: string, css: string, html: string }) {
        // Clear layout if it already exists.
        if (this.myLayout) {
            this.myLayout.destroy();
        }

        // TODO - This is a bit of a hack to get around GoldenLayout not cleaning up correctly.
        setTimeout(() => {
            this.createLayout(container, partialConfig, code);
        }, 10);
    }

    private createLayout(container: HTMLElement, partialConfig: GoldenLayout.Config | {}, defaultCode?: { typescript: string, css: string, html: string }) {

        const resizeHandlers: (() => void)[] = [];
        const editorContext: IEditorContext = {
            addResizeListener: (func: () => void) => {
                resizeHandlers.push(func);
            }
        };

        const outputFrameProps: IOutputFrameProps = {
            context: editorContext
        };

        const editors: { typescript: MonacoEditor | null, html: MonacoEditor | null, css: MonacoEditor | null } = {
            typescript: null,
            html: null,
            css: null
        };

        const optionsFrameProps = {};

        if (!defaultCode) {
            // TODO - Import these from a folder of sample files.
            defaultCode = {
                typescript: `const container = document.querySelector("div.container") as HTMLDivElement;

document.querySelector("button").addEventListener("click", () => {
    const newDiv = document.createElement("div");
    newDiv.classList.add("box");
    newDiv.style.backgroundColor = getRandomColor();

    container.appendChild(newDiv);
});

const getRandomColor = () => {
    const getRandomInteger = () => Math.round(Math.random() * 255);
    return \`rgb(\${getRandomInteger()},\${getRandomInteger()},\${getRandomInteger()})\`;
};
                `,
                css: `div.container {
    display: flex;
    flex-wrap: wrap;
}

div.box {
    width: 100px;
    height: 100px;
    margin: 5px;
}`,
                html: `<button>Click</button>

<div class="container">
</div>`
            };
        }

        const tsProps: IEditorParams = {
            language: "typescript",
            value: defaultCode.typescript,
            onChange: (code: string) => {
                this.outputHandler.update({
                    typescript: code
                });
            },
            context: editorContext
        };

        const htmlProps: IEditorParams = {
            language: "html",
            value: defaultCode.html,
            onChange: (code: string) => {
                this.outputHandler.update({
                    html: code
                });
            },
            context: editorContext
        };

        const cssProps: IEditorParams = {
            language: "css",
            value: defaultCode.css,
            onChange: (code: string) => {
                this.outputHandler.update({
                    css: code
                });
            },
            context: editorContext
        };

        const defaultConfig: GoldenLayout.Config = {
            settings: {
                showMaximiseIcon: true,
                showCloseIcon: false,
                showPopoutIcon: false
            },
            content: [{

                type: "row",
                content: [
                    {
                        type: "stack",
                        content: [
                            {
                                id: "typescript",
                                title: "typescript",
                                type: "react-component",
                                component: "MonacoEditor"
                            },
                            {
                                id: "options",
                                title: "options",
                                type: "react-component",
                                component: "OptionsFrame"
                            }
                        ]
                    },
                    {
                        type: "stack",
                        content: [
                            {
                                id: "html",
                                title: "html",
                                type: "react-component",
                                component: "MonacoEditor"
                            }, {
                                id: "css",
                                title: "css",
                                type: "react-component",
                                component: "MonacoEditor"
                            }]
                    },
                    {
                        id: "output",
                        title: "output",
                        type: "react-component",
                        component: "OutputFrame"
                    }
                ]
            }]
        };

        const configToUse = defaults(partialConfig, defaultConfig);

        const getConfigTypes = (item: { content?: GoldenLayout.ItemConfigType[] | undefined }): GoldenLayout.ItemConfigType[] => {
            if (item.content && item.content.length > 0) {
                return flatten(map(item.content, (subItem) => getConfigTypes(subItem)));
            }

            return [item as GoldenLayout.ItemConfigType];
        };

        const allConfigs = getConfigTypes(configToUse);
        const propsForComponents: { [id: string]: any } = {
            typescript: tsProps,
            css: cssProps,
            html: htmlProps,
            output: outputFrameProps,
            options: optionsFrameProps
        };
        each(allConfigs, (itemConfig: GoldenLayout.ReactComponentConfig) => {
            if (itemConfig.id && !(itemConfig.id instanceof Array)) {
                if (propsForComponents.hasOwnProperty(itemConfig.id)) {
                    itemConfig.props = propsForComponents[itemConfig.id];
                }
            }
        });

        this.myLayout = new GoldenLayout(configToUse, container);
        (this.myLayout as any)._isFullPage = true;

        this.myLayout.registerComponent("MonacoEditor", (props: IEditorParams) => {
            // TODO - This is nasty, but this seems to the best way to supply components to golden layout.
            const editor = new MonacoEditor(props);
            const key = (props as any).glContainer._config.id as "typescript" | "css" | "html";
            editors[key] = editor;

            return editor;
        });

        this.myLayout.registerComponent("OutputFrame", (props: IOutputFrameProps) => {
            const outputFrame = new OutputFrame(props);
            this.outputHandler.setOutputFrame(outputFrame);
            return outputFrame;
        });

        this.myLayout.registerComponent("OptionsFrame", (props: IOutputFrameProps) => {
            const optionsFrame = new OptionsFrame(props, this.context);
            return optionsFrame;
        });

        (this.myLayout as any).on("stateChanged", () => {
            each(resizeHandlers, (resizeHandler) => {
                resizeHandler();
            });
        });

        (this.myLayout as any).on("initialised", async () => {
            if (editors.css === null || editors.html === null || editors.typescript === null) {
                throw new Error("Not all editors are initialized.");
            }

            this.outputHandler.update({
                css: await editors.css.getEditorText(),
                html: await editors.html.getEditorText(),
                typescript: await editors.typescript.getEditorText()
            });
        });

        this.myLayout.init();
    }
}
