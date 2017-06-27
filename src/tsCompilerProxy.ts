import * as tsc from "typescript";

interface ICompileRequest {
    code: string;
}

export default class CompilerProxy {
    public compile(thingToCompile: ICompileRequest) {

        // TODO - Move transpilation to web worker.
        const result = tsc.transpileModule(thingToCompile.code, {
            compilerOptions:
            {
                module: tsc.ModuleKind.None,
                target: tsc.ScriptTarget.ES2015,
                isolatedModules: false
            },
            reportDiagnostics: true
        });

        return result.outputText;
    }
}
