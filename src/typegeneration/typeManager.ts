import { flatten, uniq } from "lodash";
import TypeGenerator from "./typeGenerator";
import TypeMetadataFinder from "./typeMetadataFinder";

export default class TypeManager {

    private fetcher: TypeMetadataFinder;

    constructor() {
        this.fetcher = new TypeMetadataFinder();
    }

    public async processCode(code: string) {
        const fetchCalls = await this.fetcher.findMetadata(code);
        const typedefs = flatten(fetchCalls.map((foundType) => {
            if (foundType.state === null) {
                return [];
            }

            return TypeGenerator.generateTypesForUrl(foundType.url, foundType.state.pathDefinition, foundType.state.definitions);
        }));

        return uniq(typedefs).join("\r\n");
    }
}
