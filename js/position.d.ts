type Placement = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';
interface PositionOptions {
    placement: Placement | 'auto';
    align?: Align;
    offset?: number;
    margin?: number;
    arrowSize?: number;
}
interface PositionResult {
    left: number;
    top: number;
    placement: Placement;
    arrowOffset?: number;
}
declare function bestPlacement(trigger: DOMRect, floating: DOMRect, offset: number): Placement;
declare function maybeFlip(placement: Placement, trigger: DOMRect, floating: DOMRect, offset: number): Placement;
declare function computePosition(trigger: DOMRect, floating: DOMRect, opts: PositionOptions): PositionResult;
export { computePosition, bestPlacement, maybeFlip };
export type { Placement, Align, PositionOptions, PositionResult };
