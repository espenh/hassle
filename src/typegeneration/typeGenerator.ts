import { ISwaggerDefinitionReference, ISwaggerDefinitions, ISwaggerPathDefinition, ISwaggerSchemaValueTypeOrReference } from "./swagger";

export default class TypeGenerator {

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

    public static generateTypesForUrl(url: string, metadata: ISwaggerPathDefinition, definitions: ISwaggerDefinitions): string[] {
        if (metadata === null) {
            return [];
        }

        const getMetadata = metadata.get;
        if (!getMetadata) {
            return [];
        }

        const getSuccessResponse = getMetadata.responses && getMetadata.responses[200];

        if (!getSuccessResponse || !getSuccessResponse.schema || !getSuccessResponse.schema.type === undefined) {
            return [];
        }

        const definitionTraverser = new DefinitionTraverser(definitions);
        const type = this.generateTypeFromSchema(getSuccessResponse.schema, definitionTraverser).toCode();
        return [
            TypeGenerator.standardTypes.reequestInitForGetQueries,
            TypeGenerator.standardTypes.typedJsonResponse,
            TypeGenerator.standardTypes.typedJsonBody,
            TypeGenerator.standardTypes.fetch(url, `TypedJsonResponse<${type}>`)
        ];
    }

    public static generateTypeFromSchema(schema: ISwaggerSchemaValueTypeOrReference | undefined, definitionTraverser?: DefinitionTraverser): ISyntaxObject {

        // TODO - There is a potential issue here with cyclic references. A Person can have a property (like p.Mother) that could also be of type Person.

        if (schema === undefined) {
            return new NoopPrimitive();
        }

        switch (schema.type) {
            case undefined:
                // Reference
                if (definitionTraverser === undefined) {
                    throw new Error("Schema references a definition, but no definitionTraverser is supplied to type generator.");
                }

                const matchingDefinition = definitionTraverser.find(schema.$ref);
                if (matchingDefinition === undefined) {
                    throw new Error("Unable to find definition for:" + schema.$ref);
                }

                if (matchingDefinition.properties !== undefined) {
                    const propNames = Object.keys(matchingDefinition.properties);
                    const properties = propNames.map((propName) => {
                        // TypeScript type flow seems to forget that we've checked .properties for undefined when .properties is accessed in the map function.
                        const propHACK = matchingDefinition.properties;
                        const property = (propHACK as any)[propName] as ISwaggerSchemaValueTypeOrReference;
                        return { key: propName, value: this.generateTypeFromSchema(property, definitionTraverser) };
                    });

                    const objectWithProperties = Object.assign({}, ...properties.map((p) => ({ [p.key]: p.value })));

                    return new ObjectWithKnownProperties(objectWithProperties);
                }

                if (matchingDefinition.allOf !== undefined) {
                    const types = matchingDefinition.allOf.map((valueOrReference) => {
                        return this.generateTypeFromSchema(valueOrReference, definitionTraverser);
                    });

                    // TODO - Merge properties of all types. I'm guessing no primitive types are allowed in the allOf array.
                    throw new Error("Schema contains .allOf composition which is not supported yet.");
                }

                throw new Error("Unknown case in schema with no type. Neither .properties or .allOf.");

            case "object":
                if (schema.additionalProperties) {
                    // Model with Map/Dictionary Properties
                    if (schema.additionalProperties.type === "string") {
                        return new ObjectWithUnknownKeys(new SyntaxObjectPrimitiveString());
                    }

                    if (schema.additionalProperties.type === "integer") {
                        return new ObjectWithUnknownKeys(new SyntaxObjectPrimitiveNumber());
                    }

                    throw new Error(`Object with additionalProperties with type ${schema.additionalProperties.type} not supported yet.`);
                }

                if (schema.properties) {
                    const propNames = Object.keys(schema.properties);
                    const properties = propNames.map((propName) => {
                        // TypeScript type flow seems to forget that we've checked .properties for undefined when .properties is accessed in the map function.
                        const propHACK = schema.properties;
                        const property = (propHACK as any)[propName] as ISwaggerSchemaValueTypeOrReference;
                        return { key: propName, value: this.generateTypeFromSchema(property, definitionTraverser) };
                    });

                    const objectWithProperties = Object.assign({}, ...properties.map((p) => ({ [p.key]: p.value })));
                    return new ObjectWithKnownProperties(objectWithProperties);
                }

                return new NoopPrimitive();
            case "array":
                return new ArrayOfSyntaxObjects(this.generateTypeFromSchema(schema.items, definitionTraverser));
            case "string":
                return new SyntaxObjectPrimitiveString();
            case "integer":
                return new SyntaxObjectPrimitiveNumber();
            case "number":
                return new SyntaxObjectPrimitiveNumber();
        }

        throw new Error("Unknown schema: " + JSON.stringify(schema));
    }
}

export class DefinitionTraverser {
    constructor(private readonly definitions: ISwaggerDefinitions | undefined) {
    }

    public find(reference: string) {
        if (this.definitions === undefined) {
            return undefined;
        }

        const prefix = "#/definitions/";
        if (!reference.startsWith(prefix)) {
            throw new Error(`Expected ref to definition to start with: ${prefix}. Reference is ${reference}`);
        }

        const refNode = reference.substring(prefix.length);
        if (!this.definitions.hasOwnProperty(refNode)) {
            return undefined;
        }

        return this.definitions[refNode];
    }
}

interface ISyntaxObject {
    toCode(): string;
}

export class SyntaxObjectPrimitiveString implements ISyntaxObject {
    public toCode() {
        return "string";
    }
}

export class SyntaxObjectPrimitiveNumber implements ISyntaxObject {
    public toCode() {
        return "number";
    }
}

export class NoopPrimitive implements ISyntaxObject {
    public toCode() {
        return "never";
    }
}

export class ObjectWithUnknownKeys implements ISyntaxObject {
    constructor(public readonly valueType: ISyntaxObject, public readonly keyType: "string" | "number" = "string") {
    }

    public toCode() {
        return `{[key:${this.keyType}]: ${this.valueType.toCode()}}`;
    }
}

export class ObjectWithKnownProperties implements ISyntaxObject {
    constructor(public readonly propertiesObject: { [propName: string]: ISyntaxObject }) {
    }

    public toCode() {
        const keys = Object.keys(this.propertiesObject);
        const props = keys.map((key) => {
            return `${key}: ${this.propertiesObject[key].toCode()}`;
        });

        return `{\r\n${props.join(",\r\n")}\r\n}`;
    }
}

export class ArrayOfSyntaxObjects implements ISyntaxObject {
    constructor(public readonly valueType: ISyntaxObject) {
    }

    public toCode() {
        return `${this.valueType.toCode()}[]`;
    }
}
