export type ChartType = 'line' | 'area' | 'column' | 'bar' | 'pie';
export type ChartCurve = 'smooth' | 'linear' | 'step';
/** A single labelled data value within a chart series. */
export interface ChartDataPoint {
    label: string;
    value: number;
}
/** A named data series with optional per-series colour override. */
export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}
/** Configuration options for a Chart instance. */
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
/** SVG-based chart component supporting line, area, column, bar, and pie types. */
declare class Chart {
    private container;
    private opts;
    private tooltip;
    private colors;
    private abortController;
    private resizeTimer;
    private resizeObserver;
    constructor(selector: string | HTMLElement, options: ChartOptions);
    private render;
    private renderLineOrArea;
    private renderColumn;
    private renderBar;
    private renderPie;
    private renderHGrid;
    private renderXAxisLine;
    private renderXLabels;
    private renderYLabels;
    private buildPath;
    private linearPath;
    private stepPath;
    /** Smooth cubic bezier path through points (Catmull-Rom → cubic bezier) */
    private smoothPath;
    private arcPath;
    private polar;
    private buildHeader;
    private buildLegend;
    private buildPieLegend;
    private showTooltip;
    private moveTooltip;
    private hideTooltip;
    private onPoint;
    private onBar;
    private resolveColors;
    private div;
    private createSVG;
    private svgEl;
    private fmt;
    private attachResizeObserver;
    update(series: ChartSeries[]): void;
    setType(type: ChartType): void;
    destroy(): void;
}
export { Chart };
