import { ISwaggerPathDefinition } from "./swagger";

export class TypeGenerator {

    private static standardTypes = {
        reequestInitForGetQueries: `interface GetRequestInit extends RequestInit {
    method: "get";
}`,
        typedJsonBody: `interface TypedJsonBody<T> {
    readonly bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    json(): Promise<T>;
    text(): Promise<string>;
}`,
        typedJsonResponse: `interface TypedJsonResponse<T> extends Object, TypedJsonBody<T> {
}`,
        fetch: (url: string, responseType: string) => {
            return `declare function fetch(input: "${url}", init?: RequestInit): Promise<${responseType}>;`;
        }
    };

    public static generateTypesForUrl(url: string, metadata: ISwaggerPathDefinition): string[] | null {
        if (metadata === null) {
            return null;
        }

        const getMetadata = metadata["get"];
        if (!getMetadata) {
            return null;
        }

        const getSuccessResponse = getMetadata.responses && getMetadata.responses[200];

        if (!getSuccessResponse) {
            return null;
        }

        const primitives = ["string", "number"];

        if (getSuccessResponse.schema.type === "array" && primitives.indexOf(getSuccessResponse.schema.items.type) >= 0) {

            const jsonType = `${getSuccessResponse.schema.items.type}[]`;

            return [
                TypeGenerator.standardTypes.reequestInitForGetQueries,
                TypeGenerator.standardTypes.typedJsonResponse,
                TypeGenerator.standardTypes.typedJsonBody,
                TypeGenerator.standardTypes.fetch(url, `TypedJsonResponse<${jsonType}>`)
            ];
        }

        if (getSuccessResponse.schema.type === "object") {
            const jsonType = `{}`;

            return [
                TypeGenerator.standardTypes.reequestInitForGetQueries,
                TypeGenerator.standardTypes.typedJsonResponse,
                TypeGenerator.standardTypes.typedJsonBody,
                TypeGenerator.standardTypes.fetch(url, `TypedJsonResponse<${jsonType}>`)
            ];
        }

        return null;

        /*const dataClassName = `_IGEN${getMetadata.operationId}`;

        return dataClassName;*/
    }

    public static generateTypes() {

        const typesForTargets = [
            {
                url: "http://party",
                name: `party`,
                fields: [
                    {
                        name: "booze",
                        type: "string",
                    },
                    {
                        name: "hats",
                        type: "boolean",
                    },
                ],
            },
        ];

        const generatedTypes = typesForTargets.map((typeForTarget) => {
            const dataClassName = `_IGEN${typeForTarget.name}`;

            const fields = typeForTarget.fields.map((field) => {
                return `${field.name}: ${field.type}`;
            });

            const requestInitType: "RequestInit" | "GetRequestInit" = "GetRequestInit";

            return `
        interface ${dataClassName} {
            ${fields.join("\r\n")}
        }

        declare function fetch(input: "${typeForTarget.url}", init?: ${requestInitType}): Promise<TypedJsonResponse<${dataClassName}>>;
        `;
        });

        return generatedTypes.join("\r\n");
    }
}

export class Swag {

}
