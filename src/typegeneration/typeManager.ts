import * as _ from "lodash";
import { TypeGenerator } from "./typeGenerator";
import TypeMetadataFinder from "./typeMetadataFinder";

export default class TypeManager {

    private fetcher: TypeMetadataFinder;
    constructor(private newTypeDefinitionHandler: (typeDefinitions: string) => void) {
        this.fetcher = new TypeMetadataFinder();
    }

    public async processCode(code: string) {
        const fetchCalls = await this.fetcher.findMetadata(code);
        const typedefs = fetchCalls.map((foundType) => {
            if (foundType.state === null) {
                return;
            }

            return TypeGenerator.generateTypesForUrl(foundType.url, foundType.state);
        }).filter((typedef) => typedef !== null);

        this.newTypeDefinitionHandler(_.uniq(typedefs).join("\r\n"));
    }
}
