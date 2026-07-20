declare class ListenerGroup {
    private controller;
    get signal(): AbortSignal;
    reset(): void;
    destroy(): void;
}
export { ListenerGroup };
