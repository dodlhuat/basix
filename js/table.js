import {Select} from "./select.js";

class Table {
    constructor(container, options = {}) {
        this.container = document.querySelector(container);
        if (!this.container) {
            console.error(`Container with "${container}" not found.`);
            return;
        }

        this.data = options.data || [];
        this.columns = options.columns || [];
        this.pageSize = options.pageSize || 10;
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc'; // 'asc' or 'desc'
        this.filterText = '';

        if (this.data.length === 0 && this.container.querySelector('table')) {
            this.parseTableFromDOM();
        }

        this.init();
    }

    parseTableFromDOM() {
        const table = this.container.querySelector('table');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        if (!thead || !tbody) return;

        // Parse Columns
        const ths = thead.querySelectorAll('th');
        this.columns = Array.from(ths).map((th, index) => {
            return {
                key: `col${index}`,
                label: th.textContent.trim(),
                sortable: true
            };
        });

        // Parse Data
        const trs = tbody.querySelectorAll('tr');
        this.data = Array.from(trs).map(tr => {
            const row = {};
            const tds = tr.querySelectorAll('td');
            tds.forEach((td, index) => {
                if (this.columns[index]) {
                    row[this.columns[index].key] = td.textContent.trim();
                }
            });
            return row;
        });

        // Clear the existing static table
        this.container.innerHTML = '';
    }

    init() {
        this.renderControls();
        this.renderTableStructure();
        this.render();
    }

    renderControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'table-controls';

        // Search Input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search...';
        searchInput.className = 'search-input';
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        controlsDiv.appendChild(searchInput);

        // Page Size Select
        const selectGroup = document.createElement('div');
        selectGroup.className = 'select-group';

        const label = document.createElement('label');
        label.textContent = 'Page Size';
        selectGroup.appendChild(label);

        const pageSizeSelect = document.createElement('select');
        pageSizeSelect.className = 'page-size-select';
        [5, 10, 20, 50].forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `${size} per page`;
            if (size === this.pageSize) option.selected = true;
            pageSizeSelect.appendChild(option);
        });
        pageSizeSelect.addEventListener('change', (e) => this.handlePageSizeChange(parseInt(e.target.value)));
        this.assignUniqueId(pageSizeSelect, 'page-size-select-0');

        selectGroup.appendChild(pageSizeSelect);
        controlsDiv.appendChild(selectGroup);

        this.container.appendChild(controlsDiv);
        new Select('#' + pageSizeSelect.id);
    }

    renderTableStructure() {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Header Row
        const tr = document.createElement('tr');
        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.dataset.key = col.key;
            if (col.sortable !== false) {
                th.addEventListener('click', () => this.handleSort(col.key));
            }
            tr.appendChild(th);
        });
        thead.appendChild(tr);

        table.appendChild(thead);
        table.appendChild(tbody);
        wrapper.appendChild(table);
        this.container.appendChild(wrapper);

        // Pagination Container
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination';
        this.container.appendChild(paginationDiv);

        this.tableBody = tbody;
        this.tableHeader = thead;
        this.paginationContainer = paginationDiv;
    }

    getFilteredAndSortedData() {
        let processedData = [...this.data];

        // Filter
        if (this.filterText) {
            const lowerFilter = this.filterText.toLowerCase();
            processedData = processedData.filter(row => {
                return this.columns.some(col => {
                    const val = String(row[col.key] || '').toLowerCase();
                    return val.includes(lowerFilter);
                });
            });
        }

        // Sort
        if (this.sortColumn) {
            processedData.sort((a, b) => {
                const valA = a[this.sortColumn];
                const valB = b[this.sortColumn];

                if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedData;
    }

    render() {
        const processedData = this.getFilteredAndSortedData();
        const totalItems = processedData.length;
        const totalPages = Math.ceil(totalItems / this.pageSize);

        // Ensure current page is valid
        if (this.currentPage > totalPages) this.currentPage = Math.max(1, totalPages);
        if (this.currentPage < 1 && totalPages > 0) this.currentPage = 1;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, totalItems);
        const pageData = processedData.slice(startIndex, endIndex);

        this.renderBody(pageData);
        this.renderPagination(totalItems, totalPages, startIndex, endIndex);
        this.updateHeaderSortIcons();
    }

    renderBody(data) {
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
                td.textContent = row[col.key];
                td.setAttribute('data-label', col.label); // For mobile view
                tr.appendChild(td);
            });
            this.tableBody.appendChild(tr);
        });
    }

    updateHeaderSortIcons() {
        const ths = this.tableHeader.querySelectorAll('th');
        ths.forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.key === this.sortColumn) {
                th.classList.add(this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        });
    }

    renderPagination(totalItems, totalPages, startIndex, endIndex) {
        this.paginationContainer.innerHTML = '';

        if (totalItems === 0) return;

        // Info Text
        const info = document.createElement('div');
        info.className = 'pagination-info';
        info.textContent = `Showing ${startIndex + 1} to ${endIndex} of ${totalItems} entries`;
        this.paginationContainer.appendChild(info);

        // Buttons
        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'pagination-buttons';

        // Previous
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = this.currentPage === 1;
        prevBtn.addEventListener('click', () => this.setPage(this.currentPage - 1));
        buttonsDiv.appendChild(prevBtn);

        // Page Numbers (Simple implementation: show all or limited range)
        // For simplicity, let's show max 5 page buttons around current page
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === this.currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener('click', () => this.setPage(i));
            buttonsDiv.appendChild(btn);
        }

        // Next
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = this.currentPage === totalPages;
        nextBtn.addEventListener('click', () => this.setPage(this.currentPage + 1));
        buttonsDiv.appendChild(nextBtn);

        this.paginationContainer.appendChild(buttonsDiv);
    }

    handleSearch(text) {
        this.filterText = text;
        this.currentPage = 1; // Reset to first page on search
        this.render();
    }

    handleSort(key) {
        if (this.sortColumn === key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = key;
            this.sortDirection = 'asc';
        }
        this.render();
    }

    handlePageSizeChange(size) {
        this.pageSize = size;
        this.currentPage = 1;
        this.render();
    }

    setPage(page) {
        this.currentPage = page;
        this.render();
    }

    assignUniqueId(element, baseId) {
        if (!element || !baseId) return null;

        let id = baseId;
        let counter = 1;

        // If baseId already ends with a number, split it
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
}

export {Table};