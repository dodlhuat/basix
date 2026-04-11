/**
 * Shared floating-element positioning utility.
 * Used by Tooltip and Popover.
 */
/** Pick the placement with the most available space, preferring bottom > top > right > left. */
function bestPlacement(trigger, floating, offset) {
    const space = {
        bottom: window.innerHeight - trigger.bottom - offset,
        top: trigger.top - offset,
        right: window.innerWidth - trigger.right - offset,
        left: trigger.left - offset,
    };
    if (space.bottom >= floating.height)
        return 'bottom';
    if (space.top >= floating.height)
        return 'top';
    if (space.right >= floating.width)
        return 'right';
    if (space.left >= floating.width)
        return 'left';
    // Fallback: largest available side
    return (Object.entries(space).sort((a, b) => b[1] - a[1])[0][0]);
}
/** Flip to opposite side if preferred placement doesn't fit. */
function maybeFlip(placement, trigger, floating, offset) {
    const fits = {
        top: trigger.top - offset >= floating.height,
        bottom: window.innerHeight - trigger.bottom - offset >= floating.height,
        left: trigger.left - offset >= floating.width,
        right: window.innerWidth - trigger.right - offset >= floating.width,
    };
    const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    return (!fits[placement] && fits[opp[placement]]) ? opp[placement] : placement;
}
/**
 * Compute `left` / `top` for a `position: fixed` floating element anchored to a trigger.
 * Handles placement resolution (auto + flip), cross-axis alignment, viewport clamping,
 * and optional arrow offset calculation.
 */
function computePosition(trigger, floating, opts) {
    const offset = opts.offset ?? 8;
    const margin = opts.margin ?? 8;
    const align = opts.align ?? 'center';
    const placement = opts.placement === 'auto'
        ? bestPlacement(trigger, floating, offset)
        : maybeFlip(opts.placement, trigger, floating, offset);
    // Main-axis offset
    let left = 0, top = 0;
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
    // Cross-axis alignment
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
    }
    else {
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
    // Clamp to viewport
    const l = Math.max(margin, Math.min(window.innerWidth - floating.width - margin, left));
    const t = Math.max(margin, Math.min(window.innerHeight - floating.height - margin, top));
    // Arrow offset: keep arrow centred on the trigger even after viewport clamping
    let arrowOffset;
    if (opts.arrowSize !== undefined) {
        const minOff = opts.arrowSize + 8; // min distance from rounded corner
        if (placement === 'top' || placement === 'bottom') {
            const raw = trigger.left + trigger.width / 2 - l;
            arrowOffset = Math.max(minOff, Math.min(floating.width - minOff, raw));
        }
        else {
            const raw = trigger.top + trigger.height / 2 - t;
            arrowOffset = Math.max(minOff, Math.min(floating.height - minOff, raw));
        }
    }
    return { left: l, top: t, placement, arrowOffset };
}
export { computePosition, bestPlacement, maybeFlip };
