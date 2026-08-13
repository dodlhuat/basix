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
    showDataLabels?: boolean;
    animate?: boolean;
    curve?: ChartCurve;
    stacked?: boolean;
    innerRadius?: number;
    yMin?: number;
    yMax?: number;
    iconBasePath?: string;
    emptyMessage?: string;
    onPointClick?: (series: ChartSeries, point: ChartDataPoint, index: number) => void;
}
declare class Chart {
    private static readonly TYPE_LABELS;
    private readonly container;
    private readonly listeners;
    private opts;
    private tooltip;
    private colors;
    private hiddenIndices;
    private donutCenterValueEl;
    private donutCenterLabelEl;
    private resizeTimer;
    private resizeObserver;
    constructor(selector: string | HTMLElement, options: ChartOptions);
    update(series: ChartSeries[]): void;
    setType(type: ChartType): void;
    destroy(): void;
    private render;
    private renderLineOrArea;
    private renderColumn;
    private renderBar;
    private renderPie;
    private renderEmptyState;
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
    private valueToY;
    private valueToX;
    private computeRange;
    private visibleSeriesEntries;
    private hasVisibleData;
    private buildBarRect;
    private buildChartLabel;
    private buildHeader;
    private buildLegend;
    private buildPieLegend;
    private toggleIndex;
    private updateDonutCenter;
    private bindInteraction;
    private showTooltip;
    private showTooltipAtElement;
    private moveTooltip;
    private positionTooltip;
    private hideTooltip;
    private resolveColors;
    private div;
    private createSVG;
    private svgEl;
    private fmt;
    private attachResizeObserver;
}
export { Chart };
export type { ChartType, ChartCurve, ChartDataPoint, ChartSeries, ChartOptions };
