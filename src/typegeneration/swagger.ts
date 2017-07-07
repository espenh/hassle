type ConsumeProduceFormat = "application/json" | "text/json";

type SwaggerActionParameterType = "string" | "number";
type SwaggerActionParameterFormat = "date-time" | "number";
type SwaggerActionResponseDataType = "string" | "number" | "array" | "object";
type SwaggerAdditionalPropertyTypes = "integer" | "string";

interface ISwaggerActionParameter {
    name: string;
    in: "query";
    description: string;
    required: boolean;
    type: SwaggerActionParameterType;
    format?: SwaggerActionParameterFormat;
}

export interface ISwaggerDefinitionProperty {
    description: string;
    type: SwaggerActionResponseDataType;
    items?: {
        [key: string]: string;
    };
}

export interface ISwaggerDefinitionReference {
    type?: undefined;
    $ref: string;
}

interface ISwaggerSchemaObjectType {
    type: "object";
    additionalProperties?: {
        type: SwaggerAdditionalPropertyTypes
    };
    properties?: {
        [name: string]: ISwaggerSchemaValueTypeOrReference;
    };
}

interface ISwaggerSchemaArrayType {
    type: "array";
    items: ISwaggerSchemaValueTypeOrReference;
}

interface ISwaggerSchemaStringType {
    type: "string";
    format?: "byte" | "binary" | "date" | "date-time" | "password";
}

interface ISwaggerSchemaIntegerType {
    type: "integer";
    format: "int32" | "int64";
}

interface ISwaggerSchemaNumberType {
    type: "number";
    format: "float" | "double";
}

interface ISwaggerSchemaBooleanType {
    type: "boolean";
}

export type ISwaggerSchemaValueType = ISwaggerSchemaObjectType | ISwaggerSchemaArrayType | ISwaggerSchemaStringType | ISwaggerSchemaIntegerType | ISwaggerSchemaNumberType | ISwaggerSchemaBooleanType;

export type ISwaggerSchemaValueTypeOrReference = ISwaggerSchemaValueType | ISwaggerDefinitionReference;

export interface ISwaggerDefinitions {
    [name: string]: ISwaggerDefinition;
}

export interface ISwaggerDefinition {
    description?: string;
    properties?: {
        [name: string]: ISwaggerSchemaValueTypeOrReference;
    };
    allOf?: ISwaggerSchemaValueTypeOrReference[];
}

export interface ISwaggerPathDefinition {
    [action: string]: {
        tags: string[];
        summary: string;
        operationId: string;
        consumes: ConsumeProduceFormat[];
        produces: ConsumeProduceFormat[];
        responses: { // http://swagger.io/specification/#responsesObject
            [status: number]: {
                description: "string";
                schema?: ISwaggerSchemaValueTypeOrReference
            };
        };
        parameters: ISwaggerActionParameter[];
        deprecated: boolean;
    };
}

export interface ISwaggerResponse {
    swagger: string; // Swagger version
    info: {
        version: string; // api version
        title: string;
    };
    host: string;
    basePath?: string;
    schemes: Array<"http" | "https">;
    paths: {
        [subUrl: string]: ISwaggerPathDefinition;
    };
    definitions: ISwaggerDefinitions;
}
