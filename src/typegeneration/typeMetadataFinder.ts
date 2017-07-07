import { difference, flatten, startsWith, trimEnd, uniq, values } from "lodash";
import { ISwaggerResponse } from "./swagger";

class UrlUtils {
    public static get(url: string) {
        const urlObject = new URL(url);
        return {
            origin: urlObject.origin,
            host: urlObject.host,
            path: trimEnd(urlObject.pathname, "/")
        };
    }
}

class MetadataRepository {
    private knownMetadataSourceUrl: { [origin: string]: ISwaggerResponse | null };

    constructor() {
        this.knownMetadataSourceUrl = {};
    }

    public getKnownUrls() {
        return Object.keys(this.knownMetadataSourceUrl);
    }

    public addMetadata(url: string, metadata: ISwaggerResponse | null) {
        this.knownMetadataSourceUrl[url] = metadata;
    }

    private hasMetadataUrls() {
        return Object.keys(this.knownMetadataSourceUrl).length > 0;
    }

    public getMetadata(url: string) {
        if (!this.hasMetadataUrls()) {
            return null;
        }

        const urlParts = UrlUtils.get(url);

        const metadataForHost = values(this.knownMetadataSourceUrl).find((metadata) => metadata !== null && metadata.host === urlParts.host) as ISwaggerResponse | null;
        if (metadataForHost === undefined || metadataForHost === null) {
            return null;
        }

        let urlPathToMatch = urlParts.path;
        // Remove basepath (thing.com/v2/horses, /v2 is the basepath, /vt/horses is the urlPathToMatch).
        if (metadataForHost.basePath && startsWith(urlPathToMatch.toLowerCase(), metadataForHost.basePath.toLowerCase())) {
            urlPathToMatch = urlPathToMatch.substring(metadataForHost.basePath.length);
        }

        return {
            pathDefinition: metadataForHost.paths[urlPathToMatch] || null,
            definitions: metadataForHost.definitions
        };
    }
}

export default class TypeMetadataFinder {

    private metadataRepository: MetadataRepository;

    constructor() {
        this.metadataRepository = new MetadataRepository();
    }

    public async findMetadata(code: string) {
        const urls = this.findAllUrlStrings(code);
        await this.findAndLoadAllMetadataForUrls(urls);

        return urls.map((url) => {
            return {
                url,
                state: this.metadataRepository.getMetadata(url)
            };
        });
    }

    public findAllUrlStrings(code: string): string[] {

        const stringFinder = /(["'`])(?:(?=(\\?))\2.)*?\1/g;

        const allStringsWithQuotes: string[] = [];
        code.replace(stringFinder, (matchingString) => {
            allStringsWithQuotes.push(matchingString);
            return "";
        });

        const urlCandidates = allStringsWithQuotes.filter((match) => {
            return match.length > 2;
        }).map((match) => {
            // Remove quotes.
            return match.substring(1, match.length - 1);
        });

        return urlCandidates.filter((url) => TypeMetadataFinder.rules.every((rule) => rule(url)));
    }

    public findPotentialSwaggerEndpoints(urls: string[]) {

        // https://apireportservice.energycorp.com/
        // https://apireportservice.energycorp.com/swagger/docs/v1
        // https://apireportservice.energycorp.com/reports/portfolios

        const foundSwaggerEndPoints = uniq(flatten(urls.map((urlString) => {
            const url = new URL(urlString);

            return [
                `${url.origin}/swagger/docs/v1`,
                `${url.origin}/swagger.json`,
                `${url.origin}/swagger/docs/v2`,
                `${url.origin}/swagger/docs/v3`,
                `${url.origin}/v1/swagger.json`,
                `${url.origin}/v2/swagger.json`,
                `${url.origin}/v3/swagger.json`
            ];
        })));

        return foundSwaggerEndPoints;
    }

    public async getTypesForUrls(urls: string[]) {
        const urlWork = urls.map(async (url): Promise<{ url: string, metadata: ISwaggerResponse | null }> => {
            try {

                const isWork = url.toLowerCase().includes("energycorp.com");

                const request = await fetch(url, {
                    method: "get",
                    cache: "no-cache",
                    credentials: isWork ? "include" : "same-origin",
                    mode: "cors"
                });

                if (request.status === 200) {
                    const metadata = await request.json() as ISwaggerResponse;

                    return {
                        url,
                        metadata: metadata || null
                    };
                }

                return {
                    url,
                    metadata: null
                };
            } catch (err) {
                return {
                    url,
                    metadata: null
                };
            }
        });
        return await Promise.all(urlWork);
    }

    private async findAndLoadAllMetadataForUrls(urls: string[]) {

        const metadataPoints = this.findPotentialSwaggerEndpoints(urls);
        if (metadataPoints.length === 0) {
            return;
        }

        const unknownMetadataUrls = difference(metadataPoints, this.metadataRepository.getKnownUrls());
        const typetypetype = await this.getTypesForUrls(unknownMetadataUrls);
        typetypetype.forEach((metadataForUrl) => {
            this.metadataRepository.addMetadata(metadataForUrl.url, metadataForUrl.metadata);
        });
    }

    private static rules: Array<(url: string) => boolean> = [
        (url) => url.toLowerCase().startsWith("http") || url.toLowerCase().startsWith("www"),
    ];
}
