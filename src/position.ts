type Placement = 'top' | 'bottom' | 'left' | 'right';
type Align = 'start' | 'center' | 'end';

/** Options accepted by `computePosition`. */
interface PositionOptions {
    placement: Placement | 'auto';
    align?: Align;
    offset?: number;
    margin?: number;
    arrowSize?: number;
}

/** Result returned by `computePosition`. */
interface PositionResult {
    left: number;
    top: number;
    placement: Placement;
    arrowOffset?: number;
}

function bestPlacement(trigger: DOMRect, floating: DOMRect, offset: number): Placement {
    const space = {
        bottom: window.innerHeight - trigger.bottom - offset,
        top: trigger.top - offset,
        right: window.innerWidth - trigger.right - offset,
        left: trigger.left - offset,
    };
    if (space.bottom >= floating.height) return 'bottom';
    if (space.top >= floating.height) return 'top';
    if (space.right >= floating.width) return 'right';
    if (space.left >= floating.width) return 'left';
    // Fallback: largest available side
    return Object.entries(space).sort((a, b) => b[1] - a[1])[0][0] as Placement;
}

function maybeFlip(placement: Placement, trigger: DOMRect, floating: DOMRect, offset: number): Placement {
    const fits: Record<Placement, boolean> = {
        top: trigger.top - offset >= floating.height,
        bottom: window.innerHeight - trigger.bottom - offset >= floating.height,
        left: trigger.left - offset >= floating.width,
        right: window.innerWidth - trigger.right - offset >= floating.width,
    };
    const opp: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    return !fits[placement] && fits[opp[placement]] ? opp[placement] : placement;
}

function computePosition(trigger: DOMRect, floating: DOMRect, opts: PositionOptions): PositionResult {
    const offset = opts.offset ?? 8;
    const margin = opts.margin ?? 8;
    const align = opts.align ?? 'center';

    const placement: Placement = opts.placement === 'auto' ? bestPlacement(trigger, floating, offset) : maybeFlip(opts.placement, trigger, floating, offset);

    let left = 0,
        top = 0;
    switch (placement) {
        case 'top':
            top = trigger.top - floating.height - offset;
            break;
        case 'bottom':
            top = trigger.bottom + offset;
            break;
        case 'left':
            left = trigger.left - floating.width - offset;
            break;
        case 'right':
            left = trigger.right + offset;
            break;
    }

    if (placement === 'top' || placement === 'bottom') {
        switch (align) {
            case 'start':
                left = trigger.left;
                break;
            case 'center':
                left = trigger.left + (trigger.width - floating.width) / 2;
                break;
            case 'end':
                left = trigger.right - floating.width;
                break;
        }
    } else {
        switch (align) {
            case 'start':
                top = trigger.top;
                break;
            case 'center':
                top = trigger.top + (trigger.height - floating.height) / 2;
                break;
            case 'end':
                top = trigger.bottom - floating.height;
                break;
        }
    }

    const l = Math.max(margin, Math.min(window.innerWidth - floating.width - margin, left));
    const t = Math.max(margin, Math.min(window.innerHeight - floating.height - margin, top));

    let arrowOffset: number | undefined;
    if (opts.arrowSize !== undefined) {
        const minOff = opts.arrowSize + 8;
        if (placement === 'top' || placement === 'bottom') {
            const raw = trigger.left + trigger.width / 2 - l;
            arrowOffset = Math.max(minOff, Math.min(floating.width - minOff, raw));
        } else {
            const raw = trigger.top + trigger.height / 2 - t;
            arrowOffset = Math.max(minOff, Math.min(floating.height - minOff, raw));
        }
    }

    return { left: l, top: t, placement, arrowOffset };
}

export { computePosition, bestPlacement, maybeFlip };
export type { Placement, Align, PositionOptions, PositionResult };
