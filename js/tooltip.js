// tooltip.ts
import { computePosition } from './position.js';
class Tooltip {
    constructor(trigger, content, options = {}) {
        this.tooltipElement = null;
        this.showTimeout = null;
        this.isVisible = false;
        this.handleMouseEnter = () => {
            this.show();
        };
        this.handleMouseLeave = () => {
            this.hide();
        };
        this.handleFocus = () => {
            this.show();
        };
        this.handleBlur = () => {
            this.hide();
        };
        this.trigger = trigger;
        this.content = content;
        this.options = {
            position: options.position ?? 'auto',
            offset: options.offset ?? 8,
            delay: options.delay ?? 0,
            className: options.className ?? ''
        };
        this.attachEvents();
    }
    static initializeAll() {
        const triggers = document.querySelectorAll('[data-tooltip]');
        triggers.forEach(trigger => {
            const content = trigger.getAttribute('data-tooltip');
            const position = trigger.getAttribute('data-tooltip-position') ?? 'auto';
            const className = trigger.getAttribute('data-tooltip-class') ?? '';
            if (content) {
                new Tooltip(trigger, content, { position, className });
            }
        });
        // Also support content from separate elements
        const advancedTriggers = document.querySelectorAll('[data-tooltip-id]');
        advancedTriggers.forEach(trigger => {
            const contentId = trigger.getAttribute('data-tooltip-id');
            const position = trigger.getAttribute('data-tooltip-position') ?? 'auto';
            const className = trigger.getAttribute('data-tooltip-class') ?? '';
            if (contentId) {
                const contentElement = document.getElementById(contentId);
                if (contentElement) {
                    const content = contentElement.innerHTML;
                    new Tooltip(trigger, content, { position, className });
                }
            }
        });
    }
    show() {
        if (this.showTimeout !== null) {
            clearTimeout(this.showTimeout);
        }
        this.showTimeout = window.setTimeout(() => {
            Tooltip.hideActive();
            this.createTooltip();
            this.position();
            requestAnimationFrame(() => {
                this.tooltipElement?.classList.add('visible');
                this.isVisible = true;
            });
            Tooltip.activeTooltip = this;
        }, this.options.delay);
    }
    hide() {
        if (this.showTimeout !== null) {
            clearTimeout(this.showTimeout);
            this.showTimeout = null;
        }
        if (!this.tooltipElement)
            return;
        this.tooltipElement.classList.remove('visible');
        this.isVisible = false;
        setTimeout(() => {
            this.tooltipElement?.remove();
            this.tooltipElement = null;
            if (Tooltip.activeTooltip === this) {
                Tooltip.activeTooltip = null;
            }
        }, 200);
    }
    static hideActive() {
        if (Tooltip.activeTooltip) {
            Tooltip.activeTooltip.hide();
        }
    }
    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.id = `tooltip-${++Tooltip.idCounter}`;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.innerHTML = `<div class="tooltip-content">${this.content}</div>`;
        if (this.options.className) {
            tooltip.classList.add(this.options.className);
        }
        document.body.appendChild(tooltip);
        this.tooltipElement = tooltip;
        const previousDescribedBy = this.trigger.getAttribute('aria-describedby');
        this.trigger.setAttribute('aria-describedby', tooltip.id);
        this.trigger.setAttribute('data-previous-describedby', previousDescribedBy || '');
    }
    position() {
        if (!this.tooltipElement)
            return;
        const { left, top, placement } = computePosition(this.trigger.getBoundingClientRect(), this.tooltipElement.getBoundingClientRect(), { placement: this.options.position, offset: this.options.offset });
        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.setAttribute('data-position', placement);
    }
    attachEvents() {
        this.trigger.addEventListener('mouseenter', this.handleMouseEnter);
        this.trigger.addEventListener('mouseleave', this.handleMouseLeave);
        this.trigger.addEventListener('focus', this.handleFocus);
        this.trigger.addEventListener('blur', this.handleBlur);
    }
    destroy() {
        this.hide();
        this.trigger.removeEventListener('mouseenter', this.handleMouseEnter);
        this.trigger.removeEventListener('mouseleave', this.handleMouseLeave);
        this.trigger.removeEventListener('focus', this.handleFocus);
        this.trigger.removeEventListener('blur', this.handleBlur);
        const previousDescribedBy = this.trigger.getAttribute('data-previous-describedby');
        if (previousDescribedBy) {
            this.trigger.setAttribute('aria-describedby', previousDescribedBy);
        }
        else {
            this.trigger.removeAttribute('aria-describedby');
        }
        this.trigger.removeAttribute('data-previous-describedby');
    }
}
Tooltip.activeTooltip = null;
Tooltip.idCounter = 0;
export { Tooltip };
