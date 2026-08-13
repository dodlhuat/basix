import { escapeHtml } from './utils.js';
import { ListenerGroup } from './listeners.js';

type ChartType = 'line' | 'area' | 'column' | 'bar' | 'pie';
type ChartCurve = 'smooth' | 'linear' | 'step';

/** A single labelled data value within a chart series. */
interface ChartDataPoint {
    label: string;
    value: number;
}

/** A named data series with optional per-series colour override. */
interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}

/** Configuration options for a Chart instance. */
interface ChartOptions {
    type: ChartType;
    series: ChartSeries[];
    title?: string;
    subtitle?: string;
    /** Inner chart height in px. Default: 280 */
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    /** Show the value as text on each point/bar/slice. Default: false */
    showDataLabels?: boolean;
    animate?: boolean;
    /** Line interpolation for line/area charts. Default: 'smooth' */
    curve?: ChartCurve;
    /** Stack series on top of each other. column/bar only. Default: false */
    stacked?: boolean;
    /** Donut hole radius as a fraction of the pie radius (0-1). pie only. Default: 0 */
    innerRadius?: number;
    /** Fixed axis minimum. Default: auto (0, or lowest value x 1.1 if negative) */
    yMin?: number;
    /** Fixed axis maximum. Default: auto (highest value x 1.1) */
    yMax?: number;
    /** Base path to the SVG icon sprite, used by the empty state. Default: 'svg-icons/' */
    iconBasePath?: string;
    /** Message shown when there is no data to render. Default: 'No data to display' */
    emptyMessage?: string;
    onPointClick?: (series: ChartSeries, point: ChartDataPoint, index: number) => void;
}

/** A 2-D coordinate used for SVG path calculations. */
interface Point {
    x: number;
    y: number;
}
/** Chart margin in pixels for each edge. */
interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** A series (or pie data point) paired with its original index, used to keep colours/order stable when hidden via the legend. */
interface IndexedSeries {
    series: ChartSeries;
    index: number;
}

const MARGIN_XY: Margin = { top: 16, right: 24, bottom: 44, left: 52 };
const MARGIN_BAR: Margin = { top: 8, right: 52, bottom: 24, left: 120 };
const MARGIN_PIE: Margin = { top: 8, right: 8, bottom: 8, left: 8 };

const FALLBACK_COLORS = ['#3D63DD', '#2E8B57', '#C28A00', '#D64545', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];

const SVG_NS = 'http://www.w3.org/2000/svg';

/** SVG-based chart component supporting line, area, column, bar, and pie types. */
class Chart {
    private static readonly TYPE_LABELS: Record<ChartType, string> = {
        line: 'Line chart',
        area: 'Area chart',
        column: 'Column chart',
        bar: 'Bar chart',
        pie: 'Pie chart',
    };

    private readonly container: HTMLElement;
    private readonly listeners = new ListenerGroup();

    private opts: Omit<Required<ChartOptions>, 'yMin' | 'yMax'> & { yMin?: number; yMax?: number };
    private tooltip!: HTMLElement;
    private colors: string[] = [];
    private hiddenIndices = new Set<number>();
    private donutCenterValueEl: SVGTextElement | null = null;
    private donutCenterLabelEl: SVGTextElement | null = null;
    private resizeTimer: ReturnType<typeof setTimeout> | null = null;
    private resizeObserver: ResizeObserver | null = null;

    public constructor(selector: string | HTMLElement, options: ChartOptions) {
        const el = typeof selector === 'string' ? document.querySelector<HTMLElement>(selector) : selector;
        if (!el) throw new Error(`Chart: element not found for "${selector}"`);

        this.container = el;
        this.opts = {
            type: options.type,
            series: options.series,
            title: options.title ?? '',
            subtitle: options.subtitle ?? '',
            height: options.height ?? 280,
            showLegend: options.showLegend ?? true,
            showGrid: options.showGrid ?? true,
            showDataLabels: options.showDataLabels ?? false,
            animate: options.animate ?? true,
            curve: options.curve ?? 'smooth',
            stacked: options.stacked ?? false,
            innerRadius: options.innerRadius ?? 0,
            yMin: options.yMin,
            yMax: options.yMax,
            iconBasePath: options.iconBasePath ?? 'svg-icons/',
            emptyMessage: options.emptyMessage ?? 'No data to display',
            onPointClick: options.onPointClick ?? (() => {}),
        };

        this.render();
        this.attachResizeObserver();
    }

    public update(series: ChartSeries[]): void {
        this.opts.series = series;
        this.hiddenIndices.clear();
        this.render();
    }

    public setType(type: ChartType): void {
        this.opts.type = type;
        this.hiddenIndices.clear();
        this.render();
    }

    public destroy(): void {
        this.listeners.destroy();
        this.resizeObserver?.disconnect();
        if (this.resizeTimer) clearTimeout(this.resizeTimer);
        this.container.innerHTML = '';
        this.container.classList.remove('chart');
    }

    private render(): void {
        this.listeners.reset();

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

        if (this.opts.type === 'pie') {
            this.renderPie(canvas);
            return;
        }

        if (!this.hasVisibleData()) {
            this.renderEmptyState(canvas);
        } else {
            switch (this.opts.type) {
                case 'line':
                    this.renderLineOrArea(canvas, false);
                    break;
                case 'area':
                    this.renderLineOrArea(canvas, true);
                    break;
                case 'column':
                    this.renderColumn(canvas);
                    break;
                case 'bar':
                    this.renderBar(canvas);
                    break;
            }
        }

        if (this.opts.showLegend && this.opts.series.length > 0) {
            this.container.appendChild(this.buildLegend());
        }
    }

    private renderLineOrArea(canvas: HTMLElement, isArea: boolean): void {
        const { height, showGrid, animate, showDataLabels } = this.opts;
        const entries = this.visibleSeriesEntries();

        const m = MARGIN_XY;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const { min: dataMin, max: dataMax } = this.computeRange(entries, false);
        const yMin = this.opts.yMin ?? (dataMin < 0 ? dataMin * 1.1 : 0);
        const yMax = this.opts.yMax ?? (dataMax > 0 ? dataMax * 1.1 : 0);
        const labels = entries[0].series.data.map((d) => d.label);

        const svg = this.createSVG(canvas, svgW, svgH, this.buildChartLabel());

        if (showGrid) this.renderHGrid(svg, m, w, h);
        this.renderXAxisLine(svg, m, w, h);
        this.renderXLabels(svg, m, w, h, labels);
        this.renderYLabels(svg, m, h, yMin, yMax);

        const zeroY = this.valueToY(0, m, h, yMin, yMax);

        entries.forEach(({ series: s, index: colorIndex }) => {
            const color = this.colors[colorIndex];
            const numPts = s.data.length;
            const pts: Point[] = s.data.map((d, i) => ({
                x: m.left + (numPts > 1 ? (i / (numPts - 1)) * w : w / 2),
                y: this.valueToY(d.value, m, h, yMin, yMax),
            }));

            if (isArea) {
                const areaD = `${this.buildPath(pts)} L ${pts[pts.length - 1].x} ${zeroY} L ${pts[0].x} ${zeroY} Z`;
                svg.appendChild(
                    this.svgEl('path', {
                        d: areaD,
                        fill: color,
                        'fill-opacity': '0.12',
                        stroke: 'none',
                        class: 'chart-area',
                    }),
                );
            }

            const linePath = this.svgEl('path', {
                d: this.buildPath(pts),
                fill: 'none',
                stroke: color,
                'stroke-width': '2.5',
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
                class: 'chart-line',
            }) as SVGPathElement;

            if (animate) {
                requestAnimationFrame(() => {
                    const len = linePath.getTotalLength();
                    linePath.style.setProperty('--path-length', String(Math.ceil(len)));
                });
            }
            svg.appendChild(linePath);

            s.data.forEach((d, i) => {
                const g = this.svgEl('g', {
                    class: 'chart-point-group',
                    style: animate ? `animation-delay: ${i * 40}ms` : '',
                });
                const { x, y } = pts[i];

                g.appendChild(
                    this.svgEl('circle', {
                        cx: x,
                        cy: y,
                        r: 14,
                        fill: 'transparent',
                        class: 'chart-hit',
                    }),
                );
                g.appendChild(
                    this.svgEl('circle', {
                        cx: x,
                        cy: y,
                        r: 7,
                        fill: 'none',
                        stroke: color,
                        'stroke-width': '2',
                        class: 'chart-point-ring',
                    }),
                );
                g.appendChild(
                    this.svgEl('circle', {
                        cx: x,
                        cy: y,
                        r: 4,
                        fill: color,
                        stroke: 'var(--background)',
                        'stroke-width': '2',
                        class: 'chart-point-dot',
                    }),
                );

                const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(s.name)}: ${this.fmt(d.value)}`;
                this.bindInteraction(g, `${d.label}, ${s.name}: ${this.fmt(d.value)}`, tipHtml, () => this.opts.onPointClick(s, d, i));
                svg.appendChild(g);

                if (showDataLabels) {
                    const text = this.svgEl('text', { x, y: y - 14, 'text-anchor': 'middle', class: 'chart-data-label' });
                    text.textContent = this.fmt(d.value);
                    svg.appendChild(text);
                }
            });
        });
    }

    private renderColumn(canvas: HTMLElement): void {
        const { height, showGrid, animate, showDataLabels, stacked } = this.opts;
        const entries = this.visibleSeriesEntries();

        const m = MARGIN_XY;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const { min: dataMin, max: dataMax } = this.computeRange(entries, stacked);
        const yMin = this.opts.yMin ?? (dataMin < 0 ? dataMin * 1.1 : 0);
        const yMax = this.opts.yMax ?? (dataMax > 0 ? dataMax * 1.1 : 0);
        const labels = entries[0].series.data.map((d) => d.label);
        const numPts = labels.length;

        const svg = this.createSVG(canvas, svgW, svgH, this.buildChartLabel());

        if (showGrid) this.renderHGrid(svg, m, w, h);
        this.renderXAxisLine(svg, m, w, h);
        this.renderXLabels(svg, m, w, h, labels);
        this.renderYLabels(svg, m, h, yMin, yMax);

        const zeroY = this.valueToY(0, m, h, yMin, yMax);
        if (yMin < 0 && yMax > 0) {
            svg.appendChild(this.svgEl('line', { x1: m.left, x2: m.left + w, y1: zeroY, y2: zeroY, class: 'chart-axis-line chart-zero-line' }));
        }

        const groupW = w / numPts;
        const innerPad = groupW * 0.18;

        const addLabel = (x: number, y: number, value: number): void => {
            if (!showDataLabels) return;
            const text = this.svgEl('text', { x, y, 'text-anchor': 'middle', class: 'chart-data-label' });
            text.textContent = this.fmt(value);
            svg.appendChild(text);
        };

        if (stacked) {
            const barW = Math.max(2, groupW - innerPad);
            const stackPos = new Array<number>(numPts).fill(0);
            const stackNeg = new Array<number>(numPts).fill(0);

            entries.forEach(({ series: s, index: colorIndex }) => {
                const color = this.colors[colorIndex];
                s.data.forEach((d, i) => {
                    const base = d.value >= 0 ? stackPos[i] : stackNeg[i];
                    const top = base + d.value;
                    if (d.value >= 0) stackPos[i] = top;
                    else stackNeg[i] = top;

                    const yTop = this.valueToY(Math.max(base, top), m, h, yMin, yMax);
                    const yBottom = this.valueToY(Math.min(base, top), m, h, yMin, yMax);
                    const barH = Math.max(0, yBottom - yTop);
                    const x = m.left + i * groupW + innerPad / 2;

                    const rect = this.buildBarRect(x, yTop, barW, barH, color, 'vertical', i, 0, 1, animate);
                    const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(s.name)}: ${this.fmt(d.value)}`;
                    this.bindInteraction(rect, `${d.label}, ${s.name}: ${this.fmt(d.value)}`, tipHtml, () => this.opts.onPointClick(s, d, i));
                    svg.appendChild(rect);

                    addLabel(x + barW / 2, d.value >= 0 ? yTop - 6 : yTop + barH + 12, d.value);
                });
            });
        } else {
            const numSeries = entries.length;
            const barW = Math.max(2, (groupW - innerPad) / numSeries - 2);

            entries.forEach(({ series: s, index: colorIndex }, si) => {
                const color = this.colors[colorIndex];
                s.data.forEach((d, i) => {
                    const valueY = this.valueToY(d.value, m, h, yMin, yMax);
                    const y = Math.min(valueY, zeroY);
                    const barH = Math.abs(valueY - zeroY);
                    const x = m.left + i * groupW + innerPad / 2 + si * (barW + 2);

                    const rect = this.buildBarRect(x, y, barW, barH, color, 'vertical', i, si, numSeries, animate);
                    const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(s.name)}: ${this.fmt(d.value)}`;
                    this.bindInteraction(rect, `${d.label}, ${s.name}: ${this.fmt(d.value)}`, tipHtml, () => this.opts.onPointClick(s, d, i));
                    svg.appendChild(rect);

                    addLabel(x + barW / 2, d.value >= 0 ? y - 6 : y + barH + 12, d.value);
                });
            });
        }
    }

    private renderBar(canvas: HTMLElement): void {
        const { height, animate, showDataLabels, stacked } = this.opts;
        const entries = this.visibleSeriesEntries();

        const m = MARGIN_BAR;
        const svgW = canvas.clientWidth || 600;
        const svgH = height + m.top + m.bottom;
        const w = svgW - m.left - m.right;
        const h = height;

        const { min: dataMin, max: dataMax } = this.computeRange(entries, stacked);
        const xMin = this.opts.yMin ?? (dataMin < 0 ? dataMin * 1.1 : 0);
        const xMax = this.opts.yMax ?? (dataMax > 0 ? dataMax * 1.1 : 0);
        const labels = entries[0].series.data.map((d) => d.label);
        const numPts = labels.length;

        const svg = this.createSVG(canvas, svgW, svgH, this.buildChartLabel());

        const numTicks = 5;
        for (let t = 0; t <= numTicks; t++) {
            const val = xMin + ((xMax - xMin) * t) / numTicks;
            const x = this.valueToX(val, m, w, xMin, xMax);
            svg.appendChild(
                this.svgEl('line', {
                    x1: x,
                    x2: x,
                    y1: m.top,
                    y2: m.top + h,
                    stroke: 'var(--divider)',
                    'stroke-width': '1',
                    'stroke-dasharray': t === 0 ? 'none' : '3 4',
                    class: 'chart-grid-line',
                }),
            );
            const label = this.svgEl('text', {
                x,
                y: m.top + h + 14,
                'text-anchor': 'middle',
                class: 'chart-axis-label',
            });
            label.textContent = this.fmt(val);
            svg.appendChild(label);
        }

        const zeroX = this.valueToX(0, m, w, xMin, xMax);
        if (xMin < 0 && xMax > 0) {
            svg.appendChild(this.svgEl('line', { x1: zeroX, x2: zeroX, y1: m.top, y2: m.top + h, class: 'chart-axis-line chart-zero-line' }));
        }

        const groupH = h / numPts;
        labels.forEach((label, i) => {
            const y = m.top + i * groupH + groupH / 2;
            const text = this.svgEl('text', {
                x: m.left - 10,
                y,
                'text-anchor': 'end',
                'dominant-baseline': 'middle',
                class: 'chart-axis-label',
            });
            text.textContent = label;
            svg.appendChild(text);
        });

        const innerPad = groupH * 0.18;

        const addLabel = (x: number, y: number, value: number): void => {
            if (!showDataLabels) return;
            const text = this.svgEl('text', {
                x,
                y,
                'text-anchor': value >= 0 ? 'start' : 'end',
                'dominant-baseline': 'middle',
                class: 'chart-data-label',
            });
            text.textContent = this.fmt(value);
            svg.appendChild(text);
        };

        if (stacked) {
            const barH = Math.max(2, groupH - innerPad);
            const stackPos = new Array<number>(numPts).fill(0);
            const stackNeg = new Array<number>(numPts).fill(0);

            entries.forEach(({ series: s, index: colorIndex }) => {
                const color = this.colors[colorIndex];
                s.data.forEach((d, i) => {
                    const base = d.value >= 0 ? stackPos[i] : stackNeg[i];
                    const top = base + d.value;
                    if (d.value >= 0) stackPos[i] = top;
                    else stackNeg[i] = top;

                    const xBase = this.valueToX(base, m, w, xMin, xMax);
                    const xTop = this.valueToX(top, m, w, xMin, xMax);
                    const x = Math.min(xBase, xTop);
                    const barW = Math.abs(xTop - xBase);
                    const y = m.top + i * groupH + innerPad / 2;

                    const rect = this.buildBarRect(x, y, barW, barH, color, 'horizontal', i, 0, 1, animate);
                    const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(s.name)}: ${this.fmt(d.value)}`;
                    this.bindInteraction(rect, `${d.label}, ${s.name}: ${this.fmt(d.value)}`, tipHtml, () => this.opts.onPointClick(s, d, i));
                    svg.appendChild(rect);

                    addLabel(d.value >= 0 ? x + barW + 6 : x - 6, y + barH / 2, d.value);
                });
            });
        } else {
            const numSeries = entries.length;
            const barH = Math.max(2, (groupH - innerPad) / numSeries - 2);

            entries.forEach(({ series: s, index: colorIndex }, si) => {
                const color = this.colors[colorIndex];
                s.data.forEach((d, i) => {
                    const valueX = this.valueToX(d.value, m, w, xMin, xMax);
                    const x = Math.min(valueX, zeroX);
                    const barW = Math.abs(valueX - zeroX);
                    const y = m.top + i * groupH + innerPad / 2 + si * (barH + 2);

                    const rect = this.buildBarRect(x, y, barW, barH, color, 'horizontal', i, si, numSeries, animate);
                    const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${escapeHtml(s.name)}: ${this.fmt(d.value)}`;
                    this.bindInteraction(rect, `${d.label}, ${s.name}: ${this.fmt(d.value)}`, tipHtml, () => this.opts.onPointClick(s, d, i));
                    svg.appendChild(rect);

                    addLabel(d.value >= 0 ? x + barW + 6 : x - 6, y + barH / 2, d.value);
                });
            });
        }
    }

    private renderPie(canvas: HTMLElement): void {
        const { height, animate, showLegend, showDataLabels } = this.opts;
        const s = this.opts.series[0];
        if (!s || !s.data.length) {
            this.renderEmptyState(canvas);
            return;
        }

        const visible = s.data.map((d, i) => ({ d, i })).filter(({ i }) => !this.hiddenIndices.has(i));
        const total = visible.reduce((sum, { d }) => sum + d.value, 0);

        if (total <= 0) {
            this.renderEmptyState(canvas);
            if (showLegend) this.container.appendChild(this.buildPieLegend(s, total));
            return;
        }

        const svgW = canvas.clientWidth || 400;
        const m = MARGIN_PIE;
        const svgH = height + m.top + m.bottom;
        const cx = svgW / 2;
        const cy = svgH / 2;
        const rOuter = Math.min(svgW, svgH) / 2 - Math.max(m.top, m.left) - 8;
        const innerRadius = Math.min(0.92, Math.max(0, this.opts.innerRadius));
        const rInner = rOuter * innerRadius;

        const svg = this.createSVG(canvas, svgW, svgH, this.buildChartLabel());

        let startAngle = -90;

        visible.forEach(({ d, i }) => {
            const color = this.colors[i % this.colors.length];
            const sweep = (d.value / total) * 360;
            const endAngle = startAngle + sweep;
            const midAngle = startAngle + sweep / 2;

            const path = this.svgEl('path', {
                d: this.arcPath(cx, cy, rOuter, rInner, startAngle, endAngle),
                fill: color,
                stroke: 'var(--background)',
                'stroke-width': '2',
                class: 'chart-slice',
            }) as SVGPathElement;

            if (animate) {
                path.style.animationDelay = `${i * 70}ms`;
            }

            const { x: dx, y: dy } = this.polar(0, 0, 8, midAngle);
            const pct = (d.value / total) * 100;
            const tipHtml = `<strong>${escapeHtml(d.label)}</strong>${this.fmt(d.value)} &nbsp;&middot;&nbsp; ${pct.toFixed(1)}%`;
            const ariaLabel = `${d.label}: ${this.fmt(d.value)}, ${pct.toFixed(1)} percent`;

            this.bindInteraction(
                path,
                ariaLabel,
                tipHtml,
                () => this.opts.onPointClick(s, d, i),
                (hovering) => {
                    path.style.transform = hovering ? `translate(${dx}px, ${dy}px)` : '';
                    if (rInner > 0) this.updateDonutCenter(hovering ? d : null, total);
                },
            );

            svg.appendChild(path);

            if (showDataLabels && sweep >= 8) {
                const labelR = rInner > 0 ? (rOuter + rInner) / 2 : rOuter * 0.65;
                const { x: lx, y: ly } = this.polar(cx, cy, labelR, midAngle);
                const text = this.svgEl('text', {
                    x: lx,
                    y: ly,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle',
                    class: 'chart-slice-label',
                });
                text.textContent = `${pct.toFixed(0)}%`;
                svg.appendChild(text);
            }

            startAngle = endAngle;
        });

        if (rInner > 0) {
            this.donutCenterValueEl = this.svgEl('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', class: 'chart-donut-value' });
            this.donutCenterLabelEl = this.svgEl('text', { x: cx, y: cy + 14, 'text-anchor': 'middle', class: 'chart-donut-label' });
            this.updateDonutCenter(null, total);
            svg.appendChild(this.donutCenterValueEl);
            svg.appendChild(this.donutCenterLabelEl);
        }

        if (showLegend) {
            this.container.appendChild(this.buildPieLegend(s, total));
        }
    }

    private renderEmptyState(canvas: HTMLElement): void {
        canvas.style.minHeight = `${this.opts.height}px`;
        const el = this.div('chart-empty');
        el.innerHTML = `<svg class="icon-svg" aria-hidden="true"><use href="${this.opts.iconBasePath}icons.svg#bar_chart_off"/></svg><span>${escapeHtml(this.opts.emptyMessage)}</span>`;
        canvas.appendChild(el);
    }

    private renderHGrid(svg: SVGSVGElement, m: Margin, w: number, h: number): void {
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const y = m.top + h - (i / numTicks) * h;
            svg.appendChild(
                this.svgEl('line', {
                    x1: m.left,
                    x2: m.left + w,
                    y1: y,
                    y2: y,
                    class: i === 0 ? 'chart-axis-line' : 'chart-grid-line',
                }),
            );
        }
    }

    private renderXAxisLine(svg: SVGSVGElement, m: Margin, w: number, h: number): void {
        svg.appendChild(
            this.svgEl('line', {
                x1: m.left,
                x2: m.left + w,
                y1: m.top + h,
                y2: m.top + h,
                class: 'chart-axis-line',
            }),
        );
    }

    private renderXLabels(svg: SVGSVGElement, m: Margin, w: number, h: number, labels: string[]): void {
        const n = labels.length;
        const step = n > 1 ? w / (n - 1) : w / 2;
        labels.forEach((label, i) => {
            const x = m.left + (n > 1 ? i * step : w / 2);
            const text = this.svgEl('text', {
                x,
                y: m.top + h + 18,
                'text-anchor': 'middle',
                class: 'chart-axis-label',
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
                x: m.left - 8,
                y,
                'text-anchor': 'end',
                'dominant-baseline': 'middle',
                class: 'chart-axis-label',
            });
            text.textContent = this.fmt(val);
            svg.appendChild(text);
        }
    }

    private buildPath(pts: Point[]): string {
        switch (this.opts.curve) {
            case 'linear':
                return this.linearPath(pts);
            case 'step':
                return this.stepPath(pts);
            default:
                return this.smoothPath(pts);
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

    /** Builds a pie/donut slice path. Pass rInner <= 0 for a full pie slice. */
    private arcPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number): string {
        const outerStart = this.polar(cx, cy, rOuter, startDeg);
        const outerEnd = this.polar(cx, cy, rOuter, endDeg);
        const large = endDeg - startDeg > 180 ? 1 : 0;

        if (rInner <= 0) {
            return `M ${cx} ${cy} L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)} A ${rOuter} ${rOuter} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)} Z`;
        }

        const innerStart = this.polar(cx, cy, rInner, startDeg);
        const innerEnd = this.polar(cx, cy, rInner, endDeg);
        return [
            `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
            `A ${rOuter} ${rOuter} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
            `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
            `A ${rInner} ${rInner} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
            'Z',
        ].join(' ');
    }

    private polar(cx: number, cy: number, r: number, deg: number): Point {
        const rad = (deg * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    private valueToY(value: number, m: Margin, h: number, yMin: number, yMax: number): number {
        const range = yMax - yMin || 1;
        return m.top + h - ((value - yMin) / range) * h;
    }

    private valueToX(value: number, m: Margin, w: number, xMin: number, xMax: number): number {
        const range = xMax - xMin || 1;
        return m.left + ((value - xMin) / range) * w;
    }

    private computeRange(entries: IndexedSeries[], stacked: boolean): { min: number; max: number } {
        if (stacked) {
            const numPts = entries[0]?.series.data.length ?? 0;
            let posMax = 0;
            let negMin = 0;
            for (let i = 0; i < numPts; i++) {
                let pos = 0;
                let neg = 0;
                for (const { series } of entries) {
                    const v = series.data[i]?.value ?? 0;
                    if (v >= 0) pos += v;
                    else neg += v;
                }
                posMax = Math.max(posMax, pos);
                negMin = Math.min(negMin, neg);
            }
            return { min: negMin, max: posMax };
        }

        const allValues = entries.flatMap((e) => e.series.data.map((d) => d.value));
        return { min: Math.min(0, ...allValues), max: Math.max(0, ...allValues) };
    }

    private visibleSeriesEntries(): IndexedSeries[] {
        return this.opts.series.map((series, index) => ({ series, index })).filter((entry) => !this.hiddenIndices.has(entry.index));
    }

    private hasVisibleData(): boolean {
        return this.visibleSeriesEntries().some((e) => e.series.data.length > 0);
    }

    private buildBarRect(
        x: number,
        y: number,
        w: number,
        h: number,
        color: string,
        orientation: 'vertical' | 'horizontal',
        i: number,
        si: number,
        numSeries: number,
        animate: boolean,
    ): SVGRectElement {
        const rect = this.svgEl('rect', {
            x,
            y,
            width: w,
            height: h,
            fill: color,
            rx: 3,
            class: `chart-bar chart-bar--${orientation}`,
        }) as SVGRectElement;

        if (animate) {
            const delay = (i * numSeries + si) * 50;
            rect.style.setProperty('--animation-delay', `${delay}ms`);
            rect.style.animationDelay = `${delay}ms`;
        }
        return rect;
    }

    private buildChartLabel(): string {
        const base = this.opts.title || Chart.TYPE_LABELS[this.opts.type];
        const names = this.opts.type === 'pie' ? (this.opts.series[0]?.data.map((d) => d.label) ?? []) : this.opts.series.map((s) => s.name);
        const joined = names.filter(Boolean).join(', ');
        return joined ? `${base}: ${joined}` : base;
    }

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
            const hidden = this.hiddenIndices.has(i);
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `chart-legend-item${hidden ? ' is-hidden' : ''}`;
            item.setAttribute('aria-pressed', String(!hidden));
            item.setAttribute('aria-label', `Toggle ${s.name}`);

            const swatch = this.div('chart-legend-swatch');
            swatch.style.background = this.colors[i];
            const label = document.createElement('span');
            label.textContent = s.name;
            item.append(swatch, label);

            item.addEventListener('click', () => this.toggleIndex(i), { signal: this.listeners.signal });
            el.appendChild(item);
        });
        return el;
    }

    private buildPieLegend(s: ChartSeries, total: number): HTMLElement {
        const el = this.div('chart-pie-legend');
        s.data.forEach((d, i) => {
            const color = this.colors[i % this.colors.length];
            const hidden = this.hiddenIndices.has(i);
            const pct = !hidden && total > 0 ? (d.value / total) * 100 : 0;

            const item = document.createElement('button');
            item.type = 'button';
            item.className = `chart-pie-legend-item${hidden ? ' is-hidden' : ''}`;
            item.setAttribute('aria-pressed', String(!hidden));
            item.setAttribute('aria-label', `Toggle ${d.label}`);

            const swatch = this.div('chart-pie-legend-swatch');
            swatch.style.background = color;
            const label = document.createElement('span');
            label.textContent = d.label;
            const value = this.div('chart-pie-legend-value');
            value.textContent = hidden ? '—' : `${pct.toFixed(1)}%`;
            item.append(swatch, label, value);

            item.addEventListener('click', () => this.toggleIndex(i), { signal: this.listeners.signal });
            el.appendChild(item);
        });
        return el;
    }

    private toggleIndex(index: number): void {
        if (this.hiddenIndices.has(index)) this.hiddenIndices.delete(index);
        else this.hiddenIndices.add(index);
        this.render();
    }

    private updateDonutCenter(point: ChartDataPoint | null, total: number): void {
        if (!this.donutCenterValueEl || !this.donutCenterLabelEl) return;
        if (point) {
            this.donutCenterValueEl.textContent = this.fmt(point.value);
            this.donutCenterLabelEl.textContent = point.label;
        } else {
            this.donutCenterValueEl.textContent = this.fmt(total);
            this.donutCenterLabelEl.textContent = 'Total';
        }
    }

    private bindInteraction(el: SVGElement, ariaLabel: string, tipHtml: string, activate: () => void, onHover?: (hovering: boolean) => void): void {
        const sig = { signal: this.listeners.signal };
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', ariaLabel);

        el.addEventListener(
            'pointerenter',
            (e) => {
                onHover?.(true);
                this.showTooltip(e as PointerEvent, tipHtml);
            },
            sig,
        );
        el.addEventListener('pointermove', (e) => this.moveTooltip(e as PointerEvent), sig);
        el.addEventListener(
            'pointerleave',
            () => {
                onHover?.(false);
                this.hideTooltip();
            },
            sig,
        );
        el.addEventListener(
            'focus',
            () => {
                onHover?.(true);
                this.showTooltipAtElement(el, tipHtml);
            },
            sig,
        );
        el.addEventListener(
            'blur',
            () => {
                onHover?.(false);
                this.hideTooltip();
            },
            sig,
        );
        el.addEventListener('click', () => activate(), sig);
        el.addEventListener(
            'keydown',
            (e) => {
                const ke = e as KeyboardEvent;
                if (ke.key === 'Enter' || ke.key === ' ') {
                    ke.preventDefault();
                    activate();
                }
            },
            sig,
        );
    }

    private showTooltip(e: PointerEvent, html: string): void {
        this.tooltip.innerHTML = html;
        this.tooltip.classList.add('is-visible');
        this.moveTooltip(e);
    }

    private showTooltipAtElement(el: Element, html: string): void {
        const rect = el.getBoundingClientRect();
        this.tooltip.innerHTML = html;
        this.tooltip.classList.add('is-visible');
        this.positionTooltip(rect.left + rect.width / 2, rect.top);
    }

    private moveTooltip(e: PointerEvent): void {
        this.positionTooltip(e.clientX, e.clientY);
    }

    private positionTooltip(clientX: number, clientY: number): void {
        const tt = this.tooltip;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let x = clientX + 14;
        let y = clientY - 36;
        if (x + tt.offsetWidth > vw) x = clientX - 14 - tt.offsetWidth;
        if (y < 0) y = clientY + 14;
        if (y + tt.offsetHeight > vh) y = vh - tt.offsetHeight - 8;
        tt.style.left = `${x}px`;
        tt.style.top = `${y}px`;
    }

    private hideTooltip(): void {
        this.tooltip.classList.remove('is-visible');
    }

    private resolveColors(): void {
        const style = getComputedStyle(this.container);
        this.colors = (this.opts.type === 'pie' ? (this.opts.series[0]?.data ?? []) : this.opts.series).map((_, i) => {
            const css = style.getPropertyValue(`--chart-color-${i + 1}`).trim();
            return css || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        });

        if (this.opts.type !== 'pie') {
            this.opts.series.forEach((s, i) => {
                if (s.color) this.colors[i] = s.color;
            });
        }
    }

    private div(className: string): HTMLElement {
        const el = document.createElement('div');
        el.className = className;
        return el;
    }

    private createSVG(parent: HTMLElement, w: number, h: number, label: string): SVGSVGElement {
        const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('height', String(h));
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.classList.add('chart-svg');
        const titleEl = this.svgEl('title', {});
        titleEl.textContent = label;
        svg.appendChild(titleEl);
        parent.appendChild(svg);
        return svg;
    }

    private svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
        return el;
    }

    private fmt(v: number): string {
        const sign = v < 0 ? '-' : '';
        const abs = Math.abs(v);
        if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
        return abs % 1 === 0 ? `${sign}${Math.round(abs)}` : `${sign}${abs.toFixed(1)}`;
    }

    private attachResizeObserver(): void {
        this.resizeObserver = new ResizeObserver(() => {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);
            this.resizeTimer = setTimeout(() => this.render(), 100);
        });
        this.resizeObserver.observe(this.container);
    }
}

export { Chart };
export type { ChartType, ChartCurve, ChartDataPoint, ChartSeries, ChartOptions };
