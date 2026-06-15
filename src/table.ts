import { Select } from './select.js';

/** Descriptor for a single table column. */
interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
}

/** A single data row, keyed by column key. */
interface TableRow {
    [key: string]: string | number | boolean;
}

/** Configuration options for a Table instance. */
interface TableOptions {
    data?: TableRow[];
    columns?: TableColumn[];
    pageSize?: number;
}

type SortDirection = 'asc' | 'desc';

/** Dynamic data table with sorting, filtering, and pagination. */
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
    private abortController = new AbortController();

    public constructor(elementOrSelector: string | HTMLElement, options: TableOptions = {}) {
        const element = typeof elementOrSelector === 'string' ? document.querySelector<HTMLElement>(elementOrSelector) : elementOrSelector;

        if (!element) {
            throw new Error(`Table: Element not found for selector "${elementOrSelector}"`);
        }

        this.container = element;
        this.data = options.data ?? [];
        this.columns = options.columns ?? [];
        this.pageSize = options.pageSize ?? 10;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filterText = '';

        if (this.data.length === 0 && this.container.querySelector('table')) {
            this.parseTableFromDOM();
        }

        this.init();
    }

    private parseTableFromDOM(): void {
        const table = this.container.querySelector('table');
        if (!table) return;

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (!thead || !tbody) return;

        const ths = thead.querySelectorAll('th');
        this.columns = Array.from(ths).map((th, index) => ({
            key: `col${index}`,
            label: th.textContent?.trim() || '',
            sortable: true,
        }));

        const trs = tbody.querySelectorAll('tr');
        this.data = Array.from(trs).map((tr) => {
            const row: TableRow = {};
            const tds = tr.querySelectorAll('td');

            tds.forEach((td, index) => {
                if (this.columns[index]) {
                    row[this.columns[index].key] = td.textContent?.trim() || '';
                }
            });

            return row;
        });

        this.container.innerHTML = '';
    }

    private init(): void {
        this.renderControls();
        this.renderTableStructure();
        this.render();
    }

    private renderControls(): void {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'table-controls';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.className = 'search-input';
        searchInput.addEventListener(
            'input',
            (e) => {
                this.handleSearch((e.target as HTMLInputElement).value);
            },
            { signal: this.abortController.signal },
        );
        controlsDiv.appendChild(searchInput);

        const selectGroup = document.createElement('div');
        selectGroup.className = 'select-group';

        const label = document.createElement('label');
        label.textContent = 'Page Size';
        selectGroup.appendChild(label);

        const pageSizeSelect = document.createElement('select');
        pageSizeSelect.className = 'page-size-select';

        [5, 10, 20, 50].forEach((size) => {
            const option = document.createElement('option');
            option.value = String(size);
            option.textContent = `${size} per page`;
            option.selected = size === this.pageSize;
            pageSizeSelect.appendChild(option);
        });

        pageSizeSelect.addEventListener(
            'change',
            (e) => {
                this.handlePageSizeChange(parseInt((e.target as HTMLSelectElement).value, 10));
            },
            { signal: this.abortController.signal },
        );

        this.assignUniqueId(pageSizeSelect, 'page-size-select-0');
        selectGroup.appendChild(pageSizeSelect);
        controlsDiv.appendChild(selectGroup);

        this.container.appendChild(controlsDiv);
        new Select('#' + pageSizeSelect.id);
    }

    private renderTableStructure(): void {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const tr = document.createElement('tr');
        this.columns.forEach((col) => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.dataset.key = col.key;

            if (col.sortable !== false) {
                th.classList.add('sortable');
                th.addEventListener('click', () => this.handleSort(col.key), { signal: this.abortController.signal });
            }

            tr.appendChild(th);
        });
        thead.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);
        wrapper.appendChild(table);
        this.container.appendChild(wrapper);

        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        this.container.appendChild(paginationDiv);

        this.tableBody = tbody;
        this.tableHeader = thead;
        this.paginationContainer = paginationDiv;
    }

    private getFilteredAndSortedData(): TableRow[] {
        let processedData = [...this.data];

        if (this.filterText) {
            const lowerFilter = this.filterText.toLowerCase();
            processedData = processedData.filter((row) => {
                return this.columns.some((col) => {
                    const val = String(row[col.key] ?? '').toLowerCase();
                    return val.includes(lowerFilter);
                });
            });
        }

        if (this.sortColumn) {
            processedData.sort((a, b) => {
                const valA = a[this.sortColumn!];
                const valB = b[this.sortColumn!];

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

    private render(): void {
        const processedData = this.getFilteredAndSortedData();
        const totalItems = processedData.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);

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

        data.forEach((row) => {
            const tr = document.createElement('tr');
            this.columns.forEach((col) => {
                const td = document.createElement('td');
                td.textContent = String(row[col.key] ?? '');
                td.setAttribute('data-label', col.label);
                tr.appendChild(td);
            });
            this.tableBody.appendChild(tr);
        });
    }

    private updateHeaderSortIcons(): void {
        const ths = this.tableHeader.querySelectorAll('th');
        ths.forEach((th) => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.key === this.sortColumn) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    private renderPagination(totalItems: number, totalPages: number, startIndex: number, endIndex: number): void {
        this.paginationContainer.innerHTML = '';

        if (totalItems === 0) return;

        const info = document.createElement('div');
        info.className = 'pagination-info';
        info.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries`;
        this.paginationContainer.appendChild(info);

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'pagination-buttons';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.setPage(this.currentPage - 1));
        buttonsDiv.appendChild(prevBtn);

        let startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = String(i);
            btn.addEventListener('click', () => this.setPage(i));
            buttonsDiv.appendChild(btn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.setPage(this.currentPage + 1));
        buttonsDiv.appendChild(nextBtn);

        this.paginationContainer.appendChild(buttonsDiv);
    }

    private handleSearch(text: string): void {
        this.filterText = text;
        this.currentPage = 1;
        this.render();
    }

    private handleSort(key: string): void {
        if (this.sortColumn === key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = key;
            this.sortDirection = 'asc';
        }
        this.render();
    }

    private handlePageSizeChange(size: number): void {
        this.pageSize = size;
        this.currentPage = 1;
        this.render();
    }

    private setPage(page: number): void {
        this.currentPage = page;
        this.render();
    }

    private assignUniqueId(element: HTMLElement, baseId: string): string | null {
        if (!element || !baseId) return null;

        let id = baseId;
        let counter = 1;

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

    public setData(data: TableRow[]): void {
        this.data = data;
        this.currentPage = 1;
        this.render();
    }

    public setColumns(columns: TableColumn[]): void {
        this.columns = columns;
        this.container.innerHTML = '';
        this.init();
    }

    public getData(): TableRow[] {
        return this.getFilteredAndSortedData();
    }

    public destroy(): void {
        this.abortController.abort();
        this.container.innerHTML = '';
    }
}

export { Table, type TableRow, type TableColumn, type TableOptions };
