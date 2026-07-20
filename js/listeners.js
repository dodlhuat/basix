class ListenerGroup {
    controller = new AbortController();
    get signal() {
        return this.controller.signal;
    }
    reset() {
        this.controller.abort();
        this.controller = new AbortController();
    }
    destroy() {
        this.controller.abort();
    }
}
export { ListenerGroup };
