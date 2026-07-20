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
    private listeners;
    constructor(elementOrSelector: string | HTMLElement, options?: TableOptions);
    private parseTableFromDOM;
    private init;
    private renderControls;
    private renderTableStructure;
    private getFilteredAndSortedData;
    private render;
    private renderBody;
    private updateHeaderSortIcons;
    private renderPagination;
    private handleSearch;
    private handleSort;
    private handlePageSizeChange;
    private setPage;
    private assignUniqueId;
    setData(data: TableRow[]): void;
    setColumns(columns: TableColumn[]): void;
    getData(): TableRow[];
    destroy(): void;
}
export { Table, type TableRow, type TableColumn, type TableOptions };
