// ─── Types ──────────────────────────────────────────────────────────────────

export type ChartType  = 'line' | 'area' | 'column' | 'bar' | 'pie';
export type ChartCurve = 'smooth' | 'linear' | 'step';

export interface ChartDataPoint {
    label: string;
    value: number;
}

export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}

export interface ChartOptions {
    type: ChartType;
    series: ChartSeries[];
    title?: string;
    subtitle?: string;
    /** Inner chart height in px. Default: 280 */
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
    /** Line interpolation for line/area charts. Default: 'smooth' */
    curve?: ChartCurve;
    /** Fixed y-axis minimum. Default: 0 */
    yMin?: number;
    /** Fixed y-axis maximum. Default: auto (max value × 1.1) */
    yMax?: number;
    onPointClick?: (series: ChartSeries, point: ChartDataPoint, index: number) => void;
}

// ─── Internal ───────────────────────────────────────────────────────────────

interface Point { x: number; y: number; }
interface Margin { top: number; right: number; bottom: number; left: number; }

const MARGIN_XY: Margin   = { top: 16, right: 24, bottom: 44, left: 52 };
const MARGIN_BAR: Margin  = { top: 8,  right: 52, bottom: 24, left: 120 };
const MARGIN_PIE: Margin  = { top: 8,  right: 8,  bottom: 8,  left: 8 };

const FALLBACK_COLORS = [
    '#3D63DD', '#2E8B57', '#C28A00', '#D64545',
    '#8B5CF6', '#06B6D4', '#F97316', '#EC4899',
];

const SVG_NS = 'http://www.w3.org/2000/svg';

// ─── Chart ──────────────────────────────────────────────────────────────────

class Chart {
    private container: HTMLElement;
    private opts: Required<ChartOptions>;
    private tooltip!: HTMLElement;
    private colors: string[] = [];
    private abortController = new AbortController();
    private resizeTimer: ReturnType<typeof setTimeout> | null = null;
    private resizeObserver: ResizeObserver | null = null;

    constructor(selector: string | HTMLElement, options: ChartOptions) {
        const el = typeof selector === 'string'
            ? document.querySelector<HTMLElement>(selector)
            : selector;
        if (!el) throw new Error(`Chart: element not found for "${selector}"`);

        this.container = el;
        this.opts = {
            type:         options.type,
            series:       options.series,
            title:        options.title        ?? '',
            subtitle:     options.subtitle     ?? '',
            height:       options.height       ?? 280,
            showLegend:   options.showLegend   ?? true,
            showGrid:     options.showGrid     ?? true,
            animate:      options.animate      ?? true,
            curve:        options.curve        ?? 'smooth',
            yMin:         options.yMin         ?? 0,
            yMax:         options.yMax         ?? 0,
            onPointClick: options.onPointClick ?? (() => {}),
        };

        this.render();
        this.attachResizeObserver();
    }

    // ── Render ──────────────────────────────────────────────────────────────

    private render(): void {
        this.abortController.abort();
        this.abortController = new AbortController();

        this.container.innerHTML = '';
        this.container.classList.add('chart');
        this.resolveColors();

        if (this.opts.title || this.opts.subtitle) {
            this.container.appendChild(this.buildHeader());
        }

        const canvas = this.div('chart-canvas');
        this.container.appendChild(canvas);

        this.tooltip = this.div('chart-tooltip');
        this.container.appendChild(this.tooltip);

        switch (this.opts.type) {
            case 'line':   this.renderLineOrArea(canvas, false); break;
            case 'area':   this.renderLineOrArea(canvas, true);  break;
            case 'column': this.renderColumn(canvas);             break;
            case 'bar':    this.renderBar(canvas);                break;
            case 'pie':    this.renderPie(canvas);                break;
        }

        if (this.opts.showLegend && this.opts.type !== 'pie') {
            this.container.appendChild(this.buildLegend());
        }
    }

    // ── Line / Area ──────────────────────────────────────────────────────────

    private renderLineOrArea(canvas: HTMLElement, isArea: boolean): void {
        const { series, height, showGrid, animate, yMin } = this.opts;
        if (!series.length || !series[0].data.length) return;

        const m = MARGIN_XY;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const yMax = this.opts.yMax || Math.max(...allValues) * 1.1;
        const labels = series[0].data.map(d => d.label);

        const svg = this.createSVG(canvas, svgW, svgH);

        if (showGrid) this.renderHGrid(svg, m, w, h, yMin, yMax);
        this.renderXAxisLine(svg, m, w, h);
        this.renderXLabels(svg, m, w, h, labels);
        this.renderYLabels(svg, m, h, yMin, yMax);

        series.forEach((s, si) => {
            const color = this.colors[si];
            const numPts = s.data.length;
            const pts: Point[] = s.data.map((d, i) => ({
                x: m.left + (numPts > 1 ? (i / (numPts - 1)) * w : w / 2),
                y: m.top  + h - ((d.value - yMin) / (yMax - yMin)) * h,
            }));

            if (isArea) {
                const areaD = `${this.buildPath(pts)} L ${pts[pts.length - 1].x} ${m.top + h} L ${pts[0].x} ${m.top + h} Z`;
                svg.appendChild(this.svgEl('path', {
                    d: areaD, fill: color,
                    'fill-opacity': '0.12', stroke: 'none',
                    class: 'chart-area',
                }));
            }

            const linePath = this.svgEl('path', {
                d: this.buildPath(pts), fill: 'none',
                stroke: color, 'stroke-width': '2.5',
                'stroke-linecap': 'round', 'stroke-linejoin': 'round',
                class: 'chart-line',
            }) as SVGPathElement;

            if (animate) {
                requestAnimationFrame(() => {
                    const len = linePath.getTotalLength();
                    linePath.style.setProperty('--path-length', String(Math.ceil(len)));
                });
            }
            svg.appendChild(linePath);

            // Data point markers
            s.data.forEach((d, i) => {
                const g = this.svgEl('g', {
                    class: 'chart-point-group',
                    style: animate ? `animation-delay: ${i * 40}ms` : '',
                });
                const { x, y } = pts[i];

                g.appendChild(this.svgEl('circle', {
                    cx: x, cy: y, r: 14,
                    fill: 'transparent', class: 'chart-hit',
                }));
                g.appendChild(this.svgEl('circle', {
                    cx: x, cy: y, r: 7,
                    fill: 'none', stroke: color, 'stroke-width': '2',
                    class: 'chart-point-ring',
                }));
                g.appendChild(this.svgEl('circle', {
                    cx: x, cy: y, r: 4,
                    fill: color, stroke: 'var(--background)', 'stroke-width': '2',
                    class: 'chart-point-dot',
                }));

                this.onPoint(g, s, d, i);
                svg.appendChild(g);
            });
        });
    }

    // ── Column ───────────────────────────────────────────────────────────────

    private renderColumn(canvas: HTMLElement): void {
        const { series, height, showGrid, animate, yMin } = this.opts;
        if (!series.length || !series[0].data.length) return;

        const m = MARGIN_XY;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const yMax = this.opts.yMax || Math.max(...allValues) * 1.1;
        const labels = series[0].data.map(d => d.label);
        const numPts = labels.length;
        const numSeries = series.length;

        const svg = this.createSVG(canvas, svgW, svgH);

        if (showGrid) this.renderHGrid(svg, m, w, h, yMin, yMax);
        this.renderXAxisLine(svg, m, w, h);
        this.renderXLabels(svg, m, w, h, labels);
        this.renderYLabels(svg, m, h, yMin, yMax);

        const groupW = w / numPts;
        const innerPad = groupW * 0.18;
        const barW = Math.max(2, (groupW - innerPad) / numSeries - 2);

        series.forEach((s, si) => {
            const color = this.colors[si];
            s.data.forEach((d, i) => {
                const barH = Math.max(0, ((d.value - yMin) / (yMax - yMin)) * h);
                const x = m.left + i * groupW + innerPad / 2 + si * (barW + 2);
                const y = m.top + h - barH;

                const rect = this.svgEl('rect', {
                    x, y, width: barW, height: barH,
                    fill: color, rx: 3,
                    class: 'chart-bar chart-bar--vertical',
                }) as SVGElement;

                if (animate) {
                    const delay = (i * numSeries + si) * 50;
                    rect.style.setProperty('--animation-delay', `${delay}ms`);
                    rect.style.animationDelay = `${delay}ms`;
                }

                this.onBar(rect, s, d, i);
                svg.appendChild(rect);
            });
        });
    }

    // ── Bar (horizontal) ─────────────────────────────────────────────────────

    private renderBar(canvas: HTMLElement): void {
        const { series, height, animate } = this.opts;
        if (!series.length || !series[0].data.length) return;

        const m = MARGIN_BAR;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const xMax = this.opts.yMax || Math.max(...allValues) * 1.1;
        const labels = series[0].data.map(d => d.label);
        const numPts = labels.length;
        const numSeries = series.length;

        const svg = this.createSVG(canvas, svgW, svgH);

        // Vertical grid lines
        const numTicks = 5;
        for (let t = 0; t <= numTicks; t++) {
            const x = m.left + (t / numTicks) * w;
            svg.appendChild(this.svgEl('line', {
                x1: x, x2: x, y1: m.top, y2: m.top + h,
                stroke: 'var(--divider)', 'stroke-width': '1',
                'stroke-dasharray': t === 0 ? 'none' : '3 4',
                class: 'chart-grid-line',
            }));
            const label = this.svgEl('text', {
                x, y: m.top + h + 14,
                'text-anchor': 'middle', class: 'chart-axis-label',
            });
            label.textContent = this.fmt(xMax * t / numTicks);
            svg.appendChild(label);
        }

        // Category labels on Y axis
        const groupH = h / numPts;
        labels.forEach((label, i) => {
            const y = m.top + i * groupH + groupH / 2;
            const text = this.svgEl('text', {
                x: m.left - 10, y,
                'text-anchor': 'end', 'dominant-baseline': 'middle',
                class: 'chart-axis-label',
            });
            text.textContent = label;
            svg.appendChild(text);
        });

        // Bars
        const innerPad = groupH * 0.18;
        const barH = Math.max(2, (groupH - innerPad) / numSeries - 2);

        series.forEach((s, si) => {
            const color = this.colors[si];
            s.data.forEach((d, i) => {
                const barW = Math.max(0, (d.value / xMax) * w);
                const x = m.left;
                const y = m.top + i * groupH + innerPad / 2 + si * (barH + 2);

                const rect = this.svgEl('rect', {
                    x, y, width: barW, height: barH,
                    fill: color, rx: 3,
                    class: 'chart-bar chart-bar--horizontal',
                }) as SVGElement;

                if (animate) {
                    const delay = (i * numSeries + si) * 50;
                    rect.style.setProperty('--animation-delay', `${delay}ms`);
                    rect.style.animationDelay = `${delay}ms`;
                }

                this.onBar(rect, s, d, i);
                svg.appendChild(rect);
            });
        });
    }

    // ── Pie ──────────────────────────────────────────────────────────────────

    private renderPie(canvas: HTMLElement): void {
        const { series, height, animate, showLegend } = this.opts;
        const s = series[0];
        if (!s || !s.data.length) return;

        const svgW = canvas.clientWidth || 400;
        const m = MARGIN_PIE;
        const svgH = height + m.top + m.bottom;
        const cx = svgW / 2;
        const cy = svgH / 2;
        const r  = Math.min(svgW, svgH) / 2 - Math.max(m.top, m.left) - 8;

        const total = s.data.reduce((sum, d) => sum + d.value, 0);
        const svg = this.createSVG(canvas, svgW, svgH);

        let startAngle = -90; // start at 12 o'clock

        s.data.forEach((d, i) => {
            const color = this.colors[i % this.colors.length];
            const sweep = (d.value / total) * 360;
            const endAngle = startAngle + sweep;
            const midAngle = startAngle + sweep / 2;

            const path = this.svgEl('path', {
                d: this.arcPath(cx, cy, r, startAngle, endAngle),
                fill: color,
                stroke: 'var(--background)',
                'stroke-width': '2',
                class: 'chart-slice',
            }) as SVGPathElement;

            if (animate) {
                const delay = i * 70;
                path.style.animationDelay = `${delay}ms`;
            }

            // Hover: nudge slice outward
            const { x: dx, y: dy } = this.polar(0, 0, 8, midAngle);
            path.addEventListener('mouseenter', (e) => {
                path.style.transform = `translate(${dx}px, ${dy}px)`;
                this.showTooltip(e as MouseEvent,
                    `<strong>${d.label}</strong>${this.fmt(d.value)} &nbsp;·&nbsp; ${((d.value / total) * 100).toFixed(1)}%`
                );
            }, { signal: this.abortController.signal });

            path.addEventListener('mouseleave', () => {
                path.style.transform = '';
                this.hideTooltip();
            }, { signal: this.abortController.signal });

            path.addEventListener('click', () => {
                this.opts.onPointClick(s, d, i);
            }, { signal: this.abortController.signal });

            svg.appendChild(path);
            startAngle = endAngle;
        });

        if (showLegend) {
            this.container.appendChild(this.buildPieLegend(s, total));
        }
    }

    // ── Axis helpers ─────────────────────────────────────────────────────────

    private renderHGrid(svg: SVGSVGElement, m: Margin, w: number, h: number, yMin: number, yMax: number): void {
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const y = m.top + h - (i / numTicks) * h;
            svg.appendChild(this.svgEl('line', {
                x1: m.left, x2: m.left + w, y1: y, y2: y,
                class: i === 0 ? 'chart-axis-line' : 'chart-grid-line',
            }));
        }
    }

    private renderXAxisLine(svg: SVGSVGElement, m: Margin, w: number, h: number): void {
        svg.appendChild(this.svgEl('line', {
            x1: m.left, x2: m.left + w,
            y1: m.top + h, y2: m.top + h,
            class: 'chart-axis-line',
        }));
    }

    private renderXLabels(svg: SVGSVGElement, m: Margin, w: number, h: number, labels: string[]): void {
        const n = labels.length;
        const step = n > 1 ? w / (n - 1) : w / 2;
        labels.forEach((label, i) => {
            const x = m.left + (n > 1 ? i * step : w / 2);
            const text = this.svgEl('text', {
                x, y: m.top + h + 18,
                'text-anchor': 'middle', class: 'chart-axis-label',
            });
            text.textContent = label;
            svg.appendChild(text);
        });
    }

    private renderYLabels(svg: SVGSVGElement, m: Margin, h: number, yMin: number, yMax: number): void {
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const val = yMin + (yMax - yMin) * (i / numTicks);
            const y = m.top + h - (i / numTicks) * h;
            const text = this.svgEl('text', {
                x: m.left - 8, y,
                'text-anchor': 'end', 'dominant-baseline': 'middle',
                class: 'chart-axis-label',
            });
            text.textContent = this.fmt(val);
            svg.appendChild(text);
        }
    }

    // ── Geometry helpers ─────────────────────────────────────────────────────

    private buildPath(pts: Point[]): string {
        switch (this.opts.curve) {
            case 'linear': return this.linearPath(pts);
            case 'step':   return this.stepPath(pts);
            default:       return this.smoothPath(pts);
        }
    }

    private linearPath(pts: Point[]): string {
        if (pts.length === 0) return '';
        return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }

    private stepPath(pts: Point[]): string {
        if (pts.length === 0) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` H ${pts[i].x} V ${pts[i].y}`;
        }
        return d;
    }

    /** Smooth cubic bezier path through points (Catmull-Rom → cubic bezier) */
    private smoothPath(pts: Point[]): string {
        if (pts.length === 0) return '';
        if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
        if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

        const t = 0.35;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];
            const cp1x = p1.x + (p2.x - p0.x) * t;
            const cp1y = p1.y + (p2.y - p0.y) * t;
            const cp2x = p2.x - (p3.x - p1.x) * t;
            const cp2y = p2.y - (p3.y - p1.y) * t;
            d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x} ${p2.y}`;
        }
        return d;
    }

    private arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
        const start = this.polar(cx, cy, r, startDeg);
        const end   = this.polar(cx, cy, r, endDeg);
        const large = (endDeg - startDeg) > 180 ? 1 : 0;
        return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
    }

    private polar(cx: number, cy: number, r: number, deg: number): Point {
        const rad = deg * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    // ── Legend builders ──────────────────────────────────────────────────────

    private buildHeader(): HTMLElement {
        const el = this.div('chart-header');
        if (this.opts.title) {
            const t = this.div('chart-title');
            t.textContent = this.opts.title;
            el.appendChild(t);
        }
        if (this.opts.subtitle) {
            const s = this.div('chart-subtitle');
            s.textContent = this.opts.subtitle;
            el.appendChild(s);
        }
        return el;
    }

    private buildLegend(): HTMLElement {
        const el = this.div('chart-legend');
        this.opts.series.forEach((s, i) => {
            const item = this.div('chart-legend-item');
            const swatch = this.div('chart-legend-swatch');
            swatch.style.background = this.colors[i];
            const label = document.createElement('span');
            label.textContent = s.name;
            item.append(swatch, label);
            el.appendChild(item);
        });
        return el;
    }

    private buildPieLegend(s: ChartSeries, total: number): HTMLElement {
        const el = this.div('chart-pie-legend');
        s.data.forEach((d, i) => {
            const color = this.colors[i % this.colors.length];
            const item = this.div('chart-pie-legend-item');
            const swatch = this.div('chart-pie-legend-swatch');
            swatch.style.background = color;
            const label = document.createElement('span');
            label.textContent = d.label;
            const value = this.div('chart-pie-legend-value');
            value.textContent = `${((d.value / total) * 100).toFixed(1)}%`;
            item.append(swatch, label, value);
            el.appendChild(item);
        });
        return el;
    }

    // ── Tooltip ──────────────────────────────────────────────────────────────

    private showTooltip(e: MouseEvent, html: string): void {
        this.tooltip.innerHTML = html;
        this.tooltip.classList.add('is-visible');
        this.moveTooltip(e);
    }

    private moveTooltip(e: MouseEvent): void {
        const tt = this.tooltip;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = e.clientX + 14;
        let y = e.clientY - 36;
        // Keep inside viewport
        if (x + 200 > vw) x = e.clientX - 14 - tt.offsetWidth;
        if (y < 0) y = e.clientY + 14;
        if (y + tt.offsetHeight > vh) y = vh - tt.offsetHeight - 8;
        tt.style.left = `${x}px`;
        tt.style.top  = `${y}px`;
    }

    private hideTooltip(): void {
        this.tooltip.classList.remove('is-visible');
    }

    // ── Event wiring ─────────────────────────────────────────────────────────

    private onPoint(g: SVGElement, s: ChartSeries, d: ChartDataPoint, i: number): void {
        const sig = { signal: this.abortController.signal };
        g.addEventListener('mouseenter', (e) => {
            this.showTooltip(e as MouseEvent, `<strong>${d.label}</strong>${s.name}: ${this.fmt(d.value)}`);
        }, sig);
        g.addEventListener('mousemove', (e) => this.moveTooltip(e as MouseEvent), sig);
        g.addEventListener('mouseleave', () => this.hideTooltip(), sig);
        g.addEventListener('click', () => this.opts.onPointClick(s, d, i), sig);
    }

    private onBar(rect: SVGElement, s: ChartSeries, d: ChartDataPoint, i: number): void {
        const sig = { signal: this.abortController.signal };
        rect.style.cursor = 'pointer';
        rect.addEventListener('mouseenter', (e) => {
            this.showTooltip(e as MouseEvent, `<strong>${d.label}</strong>${s.name}: ${this.fmt(d.value)}`);
        }, sig);
        rect.addEventListener('mousemove', (e) => this.moveTooltip(e as MouseEvent), sig);
        rect.addEventListener('mouseleave', () => this.hideTooltip(), sig);
        rect.addEventListener('click', () => this.opts.onPointClick(s, d, i), sig);
    }

    // ── Color resolution ─────────────────────────────────────────────────────

    private resolveColors(): void {
        const style = getComputedStyle(this.container);
        this.colors = (this.opts.type === 'pie' ? this.opts.series[0]?.data ?? [] : this.opts.series)
            .map((_, i) => {
                const css = style.getPropertyValue(`--chart-color-${i + 1}`).trim();
                return css || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            });

        // Allow per-series color override (not pie)
        if (this.opts.type !== 'pie') {
            this.opts.series.forEach((s, i) => {
                if (s.color) this.colors[i] = s.color;
            });
        }
    }

    // ── DOM & SVG helpers ────────────────────────────────────────────────────

    private div(className: string): HTMLElement {
        const el = document.createElement('div');
        el.className = className;
        return el;
    }

    private createSVG(parent: HTMLElement, w: number, h: number): SVGSVGElement {
        const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('height', String(h));
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.classList.add('chart-svg');
        parent.appendChild(svg);
        return svg;
    }

    private svgEl<K extends keyof SVGElementTagNameMap>(
        tag: K,
        attrs: Record<string, string | number> = {}
    ): SVGElementTagNameMap[K] {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        return el;
    }

    private fmt(v: number): string {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
        return v % 1 === 0  ? String(Math.round(v)) : v.toFixed(1);
    }

    // ── Resize ───────────────────────────────────────────────────────────────

    private attachResizeObserver(): void {
        this.resizeObserver = new ResizeObserver(() => {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.render(), 100);
        });
        this.resizeObserver.observe(this.container);
    }

    // ── Public API ───────────────────────────────────────────────────────────

    public update(series: ChartSeries[]): void {
        this.opts.series = series;
        this.render();
    }

    public setType(type: ChartType): void {
        this.opts.type = type;
        this.render();
    }

    public destroy(): void {
        this.abortController.abort();
        this.resizeObserver?.disconnect();
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.container.innerHTML = '';
        this.container.classList.remove('chart');
    }
}

export { Chart };
