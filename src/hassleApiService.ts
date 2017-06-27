interface IHassleApiGetResponse {
    Scenario: {
        LayoutJson: string,
        Code: {
            TypeScript: string,
            Css: string,
            Html: string
        }
    };
}

interface IHassleApiSaveResponse {
    FriendlyHash: string;
}

type HassleServiceSaveResponse = { success: true, data: IHassleApiSaveResponse } | { success: false, message: string };
type HassleServiceGetResponse = { success: true, data: IHassleApiGetResponse } | { success: false, message: string };

export default class HassleApiService {

    private readonly generatedUserId: string;

    constructor() {
        // Create a userid that identifies the current user. Used for letting users update scenarios.
        let currentUserId = localStorage.getItem("hassle-userId");
        if (currentUserId === null) {
            currentUserId = this.guid();
            localStorage.setItem("hassle-userId", currentUserId);
        }

        this.generatedUserId = currentUserId;
    }

    public async getScenario(hash: string): Promise<HassleServiceGetResponse> {
        const myHeaders = new Headers({
            "Content-Type": "application/json",
            "Accept": "application/json"
        });

        const response = await fetch(`https://hassle-api.azurewebsites.net/api/scenarios/get/?code=fg/KpgvyAPexvCKoW0Xyiu9AXlHkOYIYGcO9d9cUfCs29U44W9uj0A==&scenarioFriendlyHash=${hash}`, {
            headers: myHeaders,
            method: "get",
            mode: "cors",
            cache: "no-cache"
        });

        if (response.ok) {
            // TODO - Would be nice if the azure functions returned camelCase. Couldn't find a way to specify that without throwing away respect for the accept header.
            const responseJson = await response.json() as IHassleApiGetResponse;
            return {
                success: true,
                data: responseJson
            };
        }

        return {
            success: false,
            message: response.statusText
        };
    }

    public async saveScenario(friendlyHash: string | null, layoutConfig: any, code: { typeScript: string, css: string, html: string }): Promise<HassleServiceSaveResponse> {
        const myHeaders = new Headers({
            "Content-Type": "application/json",
            "Accept": "application/json"
        });

        const stateToSave = {
            wantedHash: friendlyHash,
            layoutJson: JSON.stringify(layoutConfig),
            code,
            userId: this.generatedUserId
        };

        const response = await fetch("https://hassle-api.azurewebsites.net/api/scenarios/save/?code=0vdrKw0n1MIqijLLviOeCAy9hPks7sADlWGlJskx/vaajnD6tV/LYw==", {
            headers: myHeaders,
            method: "post",
            body: JSON.stringify(stateToSave),
            mode: "cors",
            cache: "no-cache"
        });

        if (response.ok) {
            const responseJson = await response.json() as IHassleApiSaveResponse;
            return {
                success: true,
                data: responseJson
            };
        } else {
            return {
                success: false,
                message: response.statusText
            };
        }
    }

    private guid() {
        const s4 = () => {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        };

        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    }
}
