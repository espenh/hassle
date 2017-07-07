import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

interface ICompileRequest {
    code: string;
}

export default class CompilerProxy {
    public compile(thingToCompile: ICompileRequest) {

        // TODO - Move transpilation to web worker.
        const result = transpileModule(thingToCompile.code, {
            compilerOptions:
            {
                module: ModuleKind.None,
                target: ScriptTarget.ES2015,
                isolatedModules: false
            },
            reportDiagnostics: true
        });

        return result.outputText;
    }
}
