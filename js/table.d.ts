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
declare class Table {
    private container;
    private data;
    private columns;
    private pageSize;
    private currentPage;
    private sortColumn;
    private sortDirection;
    private filterText;
    private tableBody;
    private tableHeader;
    private paginationContainer;
    private abortController;
    constructor(elementOrSelector: string | HTMLElement, options?: TableOptions);
    /**
     * Parses an existing HTML table in the DOM to extract data and columns
     */
    private parseTableFromDOM;
    /**
     * Initializes the table by rendering controls, structure, and content
     */
    private init;
    /**
     * Renders the search and page size controls
     */
    private renderControls;
    /**
     * Creates the table structure (table, thead, tbody, pagination container)
     */
    private renderTableStructure;
    /**
     * Returns filtered and sorted data based on current state
     */
    private getFilteredAndSortedData;
    /**
     * Renders the table body, pagination, and header sort indicators
     */
    private render;
    /**
     * Renders the table body rows
     */
    private renderBody;
    /**
     * Updates the sort direction indicators in table headers
     */
    private updateHeaderSortIcons;
    /**
     * Renders pagination controls and info
     */
    private renderPagination;
    /**
     * Handles search input changes
     */
    private handleSearch;
    /**
     * Handles column header clicks for sorting
     */
    private handleSort;
    /**
     * Handles page size changes
     */
    private handlePageSizeChange;
    /**
     * Sets the current page and re-renders
     */
    private setPage;
    /**
     * Assigns a unique ID to an element, incrementing if necessary
     */
    private assignUniqueId;
    /**
     * Public API: Updates the table data and re-renders
     */
    setData(data: TableRow[]): void;
    /**
     * Public API: Updates the columns and re-renders
     */
    setColumns(columns: TableColumn[]): void;
    /**
     * Public API: Gets the current filtered and sorted data
     */
    getData(): TableRow[];
    destroy(): void;
}
export { Table, TableRow, TableColumn, TableOptions };
