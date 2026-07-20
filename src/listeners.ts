class ListenerGroup {
    private controller = new AbortController();

    public get signal(): AbortSignal {
        return this.controller.signal;
    }

    public reset(): void {
        this.controller.abort();
        this.controller = new AbortController();
    }

    public destroy(): void {
        this.controller.abort();
    }
}

export { ListenerGroup };
