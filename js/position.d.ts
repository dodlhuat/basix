/**
 * Shared floating-element positioning utility.
 * Used by Tooltip and Popover.
 */
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
/** Pick the placement with the most available space, preferring bottom > top > right > left. */
declare function bestPlacement(trigger: DOMRect, floating: DOMRect, offset: number): Placement;
/** Flip to opposite side if preferred placement doesn't fit. */
declare function maybeFlip(placement: Placement, trigger: DOMRect, floating: DOMRect, offset: number): Placement;
/**
 * Compute `left` / `top` for a `position: fixed` floating element anchored to a trigger.
 * Handles placement resolution (auto + flip), cross-axis alignment, viewport clamping,
 * and optional arrow offset calculation.
 */
declare function computePosition(trigger: DOMRect, floating: DOMRect, opts: PositionOptions): PositionResult;
export { computePosition, bestPlacement, maybeFlip };
export type { Placement, Align, PositionOptions, PositionResult };
