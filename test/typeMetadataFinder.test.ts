import { expect } from "chai";
import { flatten } from "lodash";
import TypeMetadataFinder from "../src/typegeneration/typeMetadataFinder";

describe("TypeMetadataFinder", () => {

    const validProtocols = ["http", "https"];
    const validUrls = [
        "localhost",
        "localhost/",
        "example.com",
        "example.com/",
        "thing.example.com",
        "thing.example.com/api?ts=pa.rty&thing=321",
        "www.example.com",
        "www.example.com/",
        "www.example.com/api",
        "www.example.com/api?ts=1",
        "www.example.com/api?ts=party&time=now",
    ];

    const getUrls = (protocols: string[], urls: string[]) => {
        return flatten(urls.map((url) => {
            return protocols.map((protocol) => `${protocol}://${url}`);
        }));
    };

    describe("Url scraping", () => {

        const fetcher = new TypeMetadataFinder();

        it("should return all valid urls", () => {
            const urlsToTest = getUrls(validProtocols, validUrls);
            urlsToTest.forEach((url) => {
                const source =
                    `
                    let x = "some string;";
                    let y = "${url}";
                    doStuff(y);
                    doStuff("${url}");
                    `;

                const foundUrls = fetcher.findAllUrlStrings(source);
                expect(foundUrls).to.have.lengthOf(2);
            });
        });
    });

    describe("Finding metadata urls", () => {
        const fetcher = new TypeMetadataFinder();

        it("should find swagger link for petstore", () => {
            const link = "http://petstore.swagger.io/v2/store/inventory";

            const swaggerEndpoint = fetcher.findPotentialSwaggerEndpoints([link]);
            expect(swaggerEndpoint).to.include("http://petstore.swagger.io/v2/swagger.json");
        });

        it("should find swagger link for apireportservice", () => {
            const link = "https://apireportservice.energycorp.com/reports/portfolios";

            const swaggerEndpoint = fetcher.findPotentialSwaggerEndpoints([link]);
            expect(swaggerEndpoint).to.include("https://apireportservice.energycorp.com/swagger/docs/v1");
        });
    });

});
