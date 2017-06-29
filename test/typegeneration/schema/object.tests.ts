import { expect } from "chai";

import { ISwaggerSchemaValueTypeOrReference } from "../../../src/typegeneration/swagger";
import TypeGenerator, { ArrayOfSyntaxObjects, DefinitionTraverser, ObjectWithKnownProperties, ObjectWithUnknownKeys, SyntaxObjectPrimitiveNumber, SyntaxObjectPrimitiveString } from "../../../src/typegeneration/typeGenerator";
import * as integerObject from "./data/object.integer.json";

describe("Type generator for objects", () => {

    describe("When key is of type string", () => {
        it("Should handle number value types", () => {
            const objectType = TypeGenerator.generateTypeFromSchema({
                type: "object",
                additionalProperties: {
                    type: "integer",
                    format: "int32"
                }
            });

            expect(objectType).to.deep.equal(new ObjectWithUnknownKeys(new SyntaxObjectPrimitiveNumber()));
        });

        it("Should handle string value types", () => {
            const objectType = TypeGenerator.generateTypeFromSchema({
                type: "object",
                additionalProperties: {
                    type: "string"
                }
            });

            expect(objectType).to.deep.equal(new ObjectWithUnknownKeys(new SyntaxObjectPrimitiveString()));
        });
    });

    describe("When schema points to a reference", () => {
        it("Should handle object references", () => {
            const definitions = new DefinitionTraverser({
                User: {
                    properties: {
                        firstName: { type: "string" }
                    }
                }
            });

            const objectType = TypeGenerator.generateTypeFromSchema({
                $ref: "#/definitions/User"
            }, definitions);

            expect(objectType).to.deep.equal(new ObjectWithKnownProperties({
                firstName: new SyntaxObjectPrimitiveString()
            }));
        });

        it("Should handle array of object references", () => {
            const definitions = new DefinitionTraverser({
                User: {
                    properties: {
                        firstName: { type: "string" }
                    }
                }
            });

            const objectType = TypeGenerator.generateTypeFromSchema({
                type: "array",
                items: {
                    $ref: "#/definitions/User"
                }
            }, definitions);

            expect(objectType).to.deep.equal(new ArrayOfSyntaxObjects(new ObjectWithKnownProperties({
                firstName: new SyntaxObjectPrimitiveString()
            })));
        });

        it("Should handle object references where property is another reference", () => {
            const definitions = new DefinitionTraverser({
                User: {
                    properties: {
                        firstName: { type: "string" },
                        car: { $ref: "#/definitions/Car" }
                    }
                },
                Car: {
                    properties: {
                        model: { type: "integer", format: "int32" }
                    }
                }
            });

            const objectType = TypeGenerator.generateTypeFromSchema({
                $ref: "#/definitions/User"
            }, definitions);

            expect(objectType).to.deep.equal(new ObjectWithKnownProperties({
                firstName: new SyntaxObjectPrimitiveString(),
                car: new ObjectWithKnownProperties({
                    model: new SyntaxObjectPrimitiveNumber()
                })
            }));
        });
    });
});
