class ChartConfig {
    constructor() {
        this.minVal = 19;
        this.maxVal = 81;
        this.gridLines = [19, 27, 34, 38, 41, 45, 47, 50, 53, 55, 59, 62, 66, 73, 81];
        this.zoneBoundaries = [43, 55]; // Left < 43, 43 <= Mid <= 55, Right > 55
        this.rowHeight = 40; // Must match CSS .chart-row height
        this.headerHeight = 40; // Must match CSS #chart-container padding-top
        this.infoColumnWidth = 350; // Must match CSS .row-info width
        this.valueSpans = [
            {min: 19, max: 23, text: "Bad"},
            {min: 24, max: 38, text: "Better"},
            {min: 39, max: 44, text: "Ok"},
            {min: 45, max: 55, text: "Good"},
            {min: 56, max: 81, text: "Excellent"}
        ];
    }
}

class Row {
    constructor(data) {
        this.id = data.id;
        this.position = data.position;
        this.name = data.name;
        this.description = data.description || '';
        this.value = data.value;
    }

    render() {
        const div = document.createElement('div');
        div.className = 'chart-row';
        div.innerHTML = `
            <div class="row-info">
                <div class="row-name">${this.name}</div>
                <div class="row-meta">${this.description ? this.description : ''}</div>
            </div>
        `;
        return div;
    }
}

class Chart {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data.map(d => new Row(d));
        this.config = new ChartConfig();

        // Sort data by position just in case
        this.data.sort((a, b) => a.position - b.position);

        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'chart-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);

        // Handle resize
        window.addEventListener('resize', () => {
            this.render();
        });
    }

    // Helper to map value to percentage width
    // The chart area starts after the info column.
    // But wait, the prompt implies the values 19-81 are the positions.
    // If the grid lines are fixed at 19...81, then the X axis represents this range.
    // So 19 is 0% (or left edge of graph area) and 81 is 100% (or right edge).
    getPercentage(value) {
        const range = this.config.maxVal - this.config.minVal;
        // Clamp value
        const clamped = Math.max(this.config.minVal, Math.min(this.config.maxVal, value));
        return ((clamped - this.config.minVal) / range) * 100;
    }

    updateRowValue(id, newValue) {
        const row = this.data.find(r => r.id === id);
        if (row) {
            row.value = Math.max(this.config.minVal, Math.min(this.config.maxVal, newValue));
            this.render(); // Re-render to update line and dots
        }
    }

    render() {
        this.container.innerHTML = '';

        // 1. Render Background Zones
        this.renderBackgroundZones();

        // 2. Render Grid Lines
        this.renderGridLines();

        // 3. Render Content Rows
        const contentLayer = document.createElement('div');
        contentLayer.className = 'chart-content';
        this.data.forEach(row => {
            contentLayer.appendChild(row.render());
        });
        this.container.appendChild(contentLayer);

        // 4. Render Connecting Line (SVG)
        this.renderLine();
    }

    renderBackgroundZones() {
        const bgLayer = document.createElement('div');
        bgLayer.className = 'chart-background';

        // Calculate widths based on boundaries
        // Range: 19 to 81.
        // Zone 1: 19 to 43
        // Zone 2: 43 to 55
        // Zone 3: 55 to 81

        const width1 = this.getPercentage(this.config.zoneBoundaries[0]);
        const width2 = this.getPercentage(this.config.zoneBoundaries[1]) - width1;
        const width3 = 100 - (width1 + width2);

        // We need to account for the info column width which is not part of the graph area?
        // Actually, usually in these charts, the grid is the background of the whole row or just the right side?
        // Let's assume the graph area is to the right of the info column.
        // We will use CSS calc or absolute positioning.
        // To make it simple, let's make the background layer only cover the graph area.
        // The graph area width is calc(100% - 200px).

        bgLayer.style.left = `${this.config.infoColumnWidth}px`;
        bgLayer.style.width = `calc(100% - ${this.config.infoColumnWidth}px)`;

        const zone1 = document.createElement('div');
        zone1.className = 'zone zone-left';
        zone1.style.width = `${width1}%`;

        const zone2 = document.createElement('div');
        zone2.className = 'zone zone-mid';
        zone2.style.width = `${width2}%`;

        const zone3 = document.createElement('div');
        zone3.className = 'zone zone-right';
        zone3.style.width = `${width3}%`;

        bgLayer.appendChild(zone1);
        bgLayer.appendChild(zone2);
        bgLayer.appendChild(zone3);

        this.container.appendChild(bgLayer);
    }

    renderGridLines() {
        const gridLayer = document.createElement('div');
        gridLayer.className = 'grid-lines';
        gridLayer.style.left = `${this.config.infoColumnWidth}px`;
        gridLayer.style.width = `calc(100% - ${this.config.infoColumnWidth}px)`;

        this.config.gridLines.forEach(val => {
            const line = document.createElement('div');
            line.className = 'grid-line';
            line.style.left = `${this.getPercentage(val)}%`;

            const label = document.createElement('div');
            label.className = 'grid-label';
            label.innerText = val;
            label.style.left = `${this.getPercentage(val)}%`;

            gridLayer.appendChild(line);
            gridLayer.appendChild(label);
        });

        this.container.appendChild(gridLayer);
    }

    renderLine() {
        const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgLayer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgLayer.setAttribute('class', 'chart-svg-layer');
        // The SVG covers the whole container, but we need to map points to the graph area.

        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.classList.add('chart-polyline');

        const points = [];

        // We need the actual width of the graph area to calculate X coordinates in pixels
        // or we can use percentage coordinates if we set viewBox?
        // Let's use getBoundingClientRect for simplicity to get pixels,
        // but that requires the element to be in DOM. It is.

        // Wait for layout? No, we can just calculate based on percentages if we use percentage in SVG?
        // SVG doesn't support percentage points easily in polyline without viewBox.
        // Let's use a resize observer or just calculate once.

        const graphAreaWidth = this.container.clientWidth - this.config.infoColumnWidth;

        this.data.forEach((row, index) => {
            // X calculation
            const pct = this.getPercentage(row.value);
            const x = this.config.infoColumnWidth + (graphAreaWidth * (pct / 100));

            // Y calculation: headerHeight + (index * rowHeight) + (rowHeight / 2)
            const y = this.config.headerHeight + (index * this.config.rowHeight) + (this.config.rowHeight / 2);

            points.push(`${x},${y}`);

            // Draw circle for point
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.classList.add('chart-point');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 10); // Increased radius
            circle.setAttribute('fill', '#d32f2f'); // Direct fill color
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            circle.style.pointerEvents = 'all'; // Enable pointer events for hover

            // Add hover events
            circle.addEventListener('mouseover', (e) => this.showTooltip(e, row.value));
            circle.addEventListener('mouseout', () => this.hideTooltip());

            // Add title for hover (native tooltip as backup)
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `Value: ${row.value}`;
            circle.appendChild(title);

            svgLayer.appendChild(circle);

            // Draw text for value
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x); // Centered horizontally
            text.setAttribute('y', y + 4); // Centered vertically (approx)
            text.textContent = row.value;
            text.setAttribute('fill', 'white'); // White text
            text.setAttribute('font-size', '10px');
            text.setAttribute('font-family', 'sans-serif');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('text-anchor', 'middle'); // Center text
            text.style.pointerEvents = 'none'; // Let clicks pass through to circle
            svgLayer.appendChild(text);
        });

        polyline.setAttribute('points', points.join(' '));
        svgLayer.prepend(polyline); // Put line behind points

        this.container.appendChild(svgLayer);
    }

    showTooltip(e, value) {
        const span = this.config.valueSpans.find(s => value >= s.min && value <= s.max);
        if (span) {
            this.tooltip.innerText = `${span.text} (${value})`;
            this.tooltip.style.display = 'block';
            this.tooltip.style.left = `${e.pageX + 10}px`;
            this.tooltip.style.top = `${e.pageY + 10}px`;
        }
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
}
