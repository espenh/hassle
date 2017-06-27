export default class HashHandler {

    constructor(hashHandler: (hash: string) => void) {
        window.addEventListener("hashchange", () => {
            hashHandler(this.getCurrentHash());
        });
    }

    public getCurrentHash() {
        return this.cleanHash(window.location.hash);
    }

    public setStateWithoutEventing(newHash: string) {
        if (newHash === this.getCurrentHash()) {
            return;
        }

        window.history.pushState(null, document.title, "#" + newHash);
    }

    private cleanHash(hash: string) {
        if (hash && hash[0] === "#") {
            return hash.substring(1);
        }

        return hash;
    }
}
