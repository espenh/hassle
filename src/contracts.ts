export interface IEditorParams {
    value: string;
    language: string;
    onChange: (newValue: string) => any;
    context: IEditorContext;
}

export interface IEditorContext {
    addResizeListener(listener: () => void): void;
}
