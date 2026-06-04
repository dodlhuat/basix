type ChartType = 'line' | 'area' | 'column' | 'bar' | 'pie';
type ChartCurve = 'smooth' | 'linear' | 'step';
interface ChartDataPoint {
    label: string;
    value: number;
}
interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
}
interface ChartOptions {
    type: ChartType;
    series: ChartSeries[];
    title?: string;
    subtitle?: string;
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    animate?: boolean;
    curve?: ChartCurve;
    yMin?: number;
    yMax?: number;
    onPointClick?: (series: ChartSeries, point: ChartDataPoint, index: number) => void;
}
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
export type { ChartType, ChartCurve, ChartDataPoint, ChartSeries, ChartOptions };
