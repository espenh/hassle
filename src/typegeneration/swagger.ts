type ConsumeProduceFormat = "application/json" | "text/json";

type SwaggerActionParameterType = "string" | "number";
type SwaggerActionParameterFormat = "date-time" | "number";
type SwaggerActionResponseDataType = "string" | "number" | "array" | "object";

interface ISwaggerActionParameter {
    name: string;
    in: "query";
    description: string;
    required: boolean;
    type: SwaggerActionParameterType;
    format?: SwaggerActionParameterFormat;
}

interface ISwaggerDefinitionProperty {
    description: string;
    type: SwaggerActionResponseDataType;
    items?: {
        [key: string]: string;
    };
}

interface ISwaggerDefinition {
    description: string;
    type: "object";
    properties: {
        [name: string]: ISwaggerDefinitionProperty;
    };
}

export interface ISwaggerPathDefinition {
    [action: string]: {
        tags: string[];
        summary: string;
        operationId: string;
        consumes: ConsumeProduceFormat[];
        produces: ConsumeProduceFormat[];
        responses: {
            [status: number]: {
                description: "string";
                schema: {
                    type: SwaggerActionResponseDataType,
                    items: {
                        type: SwaggerActionResponseDataType;
                    };
                };
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
    definitions: {
        [name: string]: {

        };
    };
}
