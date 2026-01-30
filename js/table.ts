import { Select } from "./select.js";

interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
}

interface TableRow {
    [key: string]: string | number | boolean;
}

interface TableOptions {
    data?: TableRow[];
    columns?: TableColumn[];
    pageSize?: number;
}

type SortDirection = 'asc' | 'desc';

class Table {
    private container: HTMLElement;
    private data: TableRow[];
    private columns: TableColumn[];
    private pageSize: number;
    private currentPage: number;
    private sortColumn: string | null;
    private sortDirection: SortDirection;
    private filterText: string;
    private tableBody!: HTMLTableSectionElement;
    private tableHeader!: HTMLTableSectionElement;
    private paginationContainer!: HTMLDivElement;

    constructor(container: string, options: TableOptions = {}) {
        const element = document.querySelector(container);

        if (!element) {
            throw new Error(`Table: Container not found for selector "${container}"`);
        }

        this.container = element as HTMLElement;
        this.data = options.data || [];
        this.columns = options.columns || [];
        this.pageSize = options.pageSize || 10;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filterText = '';

        if (this.data.length === 0 && this.container.querySelector('table')) {
            this.parseTableFromDOM();
        }

        this.init();
    }

    /**
     * Parses an existing HTML table in the DOM to extract data and columns
     */
    private parseTableFromDOM(): void {
        const table = this.container.querySelector('table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (!thead || !tbody) return;

        // Parse columns from header
        const ths = thead.querySelectorAll('th');
        this.columns = Array.from(ths).map((th, index) => ({
            key: `col${index}`,
            label: th.textContent?.trim() || '',
            sortable: true
        }));

        // Parse data from body rows
        const trs = tbody.querySelectorAll('tr');
        this.data = Array.from(trs).map(tr => {
            const row: TableRow = {};
            const tds = tr.querySelectorAll('td');

            tds.forEach((td, index) => {
                if (this.columns[index]) {
                    row[this.columns[index].key] = td.textContent?.trim() || '';
                }
            });

            return row;
        });

        // Clear the existing static table
        this.container.innerHTML = '';
    }

    /**
     * Initializes the table by rendering controls, structure, and content
     */
    private init(): void {
        this.renderControls();
        this.renderTableStructure();
        this.render();
    }

    /**
     * Renders the search and page size controls
     */
    private renderControls(): void {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'table-controls';

        // Search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', (e) => {
            this.handleSearch((e.target as HTMLInputElement).value);
        });
        controlsDiv.appendChild(searchInput);

        // Page size selector
        const selectGroup = document.createElement('div');
        selectGroup.className = 'select-group';

        const label = document.createElement('label');
        label.textContent = 'Page Size';
        selectGroup.appendChild(label);

        const pageSizeSelect = document.createElement('select');
        pageSizeSelect.className = 'page-size-select';

        [5, 10, 20, 50].forEach(size => {
            const option = document.createElement('option');
            option.value = String(size);
            option.textContent = `${size} per page`;
            option.selected = size === this.pageSize;
            pageSizeSelect.appendChild(option);
        });

        pageSizeSelect.addEventListener('change', (e) => {
            this.handlePageSizeChange(parseInt((e.target as HTMLSelectElement).value, 10));
        });

        this.assignUniqueId(pageSizeSelect, 'page-size-select-0');
        selectGroup.appendChild(pageSizeSelect);
        controlsDiv.appendChild(selectGroup);

        this.container.appendChild(controlsDiv);
        new Select('#' + pageSizeSelect.id);
    }

    /**
     * Creates the table structure (table, thead, tbody, pagination container)
     */
    private renderTableStructure(): void {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const tr = document.createElement('tr');
        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.dataset.key = col.key;

            if (col.sortable !== false) {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.handleSort(col.key));
            }

            tr.appendChild(th);
        });
        thead.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);
        wrapper.appendChild(table);
        this.container.appendChild(wrapper);

        // Create pagination container
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        this.container.appendChild(paginationDiv);

        this.tableBody = tbody;
        this.tableHeader = thead;
        this.paginationContainer = paginationDiv;
    }

    /**
     * Returns filtered and sorted data based on current state
     */
    private getFilteredAndSortedData(): TableRow[] {
        let processedData = [...this.data];

        // Apply filter
        if (this.filterText) {
            const lowerFilter = this.filterText.toLowerCase();
            processedData = processedData.filter(row => {
                return this.columns.some(col => {
                    const val = String(row[col.key] ?? '').toLowerCase();
                    return val.includes(lowerFilter);
                });
            });
        }

        // Apply sort
        if (this.sortColumn) {
            processedData.sort((a, b) => {
                const valA = a[this.sortColumn!];
                const valB = b[this.sortColumn!];

                // Handle null/undefined values
                if (valA == null && valB == null) return 0;
                if (valA == null) return 1;
                if (valB == null) return -1;

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedData;
    }

    /**
     * Renders the table body, pagination, and header sort indicators
     */
    private render(): void {
        const processedData = this.getFilteredAndSortedData();
        const totalItems = processedData.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);

        // Ensure current page is valid
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
        }
        if (this.currentPage < 1 && totalPages > 0) {
            this.currentPage = 1;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, totalItems);
        const pageData = processedData.slice(startIndex, endIndex);

        this.renderBody(pageData);
        this.renderPagination(totalItems, totalPages, startIndex, endIndex);
        this.updateHeaderSortIcons();
    }

    /**
     * Renders the table body rows
     */
    private renderBody(data: TableRow[]): void {
        this.tableBody.innerHTML = '';

        if (data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.columns.length;
            td.textContent = 'No results found';
            td.style.textAlign = 'center';
            tr.appendChild(td);
            this.tableBody.appendChild(tr);
            return;
        }

        data.forEach(row => {
            const tr = document.createElement('tr');
            this.columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = String(row[col.key] ?? '');
                td.setAttribute('data-label', col.label); // For mobile view
                tr.appendChild(td);
            });
            this.tableBody.appendChild(tr);
        });
    }

    /**
     * Updates the sort direction indicators in table headers
     */
    private updateHeaderSortIcons(): void {
        const ths = this.tableHeader.querySelectorAll('th');
        ths.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.key === this.sortColumn) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    /**
     * Renders pagination controls and info
     */
    private renderPagination(
        totalItems: number,
        totalPages: number,
        startIndex: number,
        endIndex: number
    ): void {
        this.paginationContainer.innerHTML = '';

        if (totalItems === 0) return;

        // Info text
        const info = document.createElement('div');
        info.className = 'pagination-info';
        info.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries`;
        this.paginationContainer.appendChild(info);

        // Pagination buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'pagination-buttons';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.setPage(this.currentPage - 1));
        buttonsDiv.appendChild(prevBtn);

        // Calculate page range to display (max 5 pages)
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = String(i);
            btn.addEventListener('click', () => this.setPage(i));
            buttonsDiv.appendChild(btn);
        }

        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.setPage(this.currentPage + 1));
        buttonsDiv.appendChild(nextBtn);

        this.paginationContainer.appendChild(buttonsDiv);
    }

    /**
     * Handles search input changes
     */
    private handleSearch(text: string): void {
        this.filterText = text;
        this.currentPage = 1; // Reset to first page on search
        this.render();
    }

    /**
     * Handles column header clicks for sorting
     */
    private handleSort(key: string): void {
        if (this.sortColumn === key) {
            // Toggle sort direction
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = key;
            this.sortDirection = 'asc';
        }
        this.render();
    }

    /**
     * Handles page size changes
     */
    private handlePageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.render();
    }

    /**
     * Sets the current page and re-renders
     */
    private setPage(page: number): void {
        this.currentPage = page;
        this.render();
    }

    /**
     * Assigns a unique ID to an element, incrementing if necessary
     */
    private assignUniqueId(element: HTMLElement, baseId: string): string | null {
        if (!element || !baseId) return null;

        let id = baseId;
        let counter = 1;

        // If baseId already ends with a number, extract it
        const match = baseId.match(/^(.*?)(\d+)$/);
        if (match) {
            id = match[1];
            counter = parseInt(match[2], 10);
        }

        let uniqueId = baseId;

        while (document.getElementById(uniqueId)) {
            counter++;
            uniqueId = `${id}${counter}`;
        }

        element.id = uniqueId;
        return uniqueId;
    }

    /**
     * Public API: Updates the table data and re-renders
     */
    public setData(data: TableRow[]): void {
        this.data = data;
        this.currentPage = 1;
        this.render();
    }

    /**
     * Public API: Updates the columns and re-renders
     */
    public setColumns(columns: TableColumn[]): void {
        this.columns = columns;
        this.container.innerHTML = '';
        this.init();
    }

    /**
     * Public API: Gets the current filtered and sorted data
     */
    public getData(): TableRow[] {
        return this.getFilteredAndSortedData();
    }
}

export { Table, TableRow, TableColumn, TableOptions };