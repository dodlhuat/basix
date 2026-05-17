/** A single subgroup item within a GroupPicker group. */
interface SubgroupData {
    id: string;
    label: string;
}
/** A group with an optional list of subgroups for GroupPicker. */
interface GroupData {
    id: string;
    label: string;
    subgroups?: SubgroupData[];
}
/** The current selection state returned by GroupPicker. */
interface GroupPickerSelection {
    parentGroups: string[];
    subgroups: {
        groupId: string;
        subgroupId: string;
    }[];
}
/** Configuration options for the GroupPicker component. */
interface GroupPickerOptions {
    onSelectionChange?: (selection: GroupPickerSelection) => void;
    searchPlaceholder?: string;
    selectAllLabel?: string;
    deselectLabel?: string;
    emptyLabel?: string;
    selectionPlaceholder?: string;
}
/** Searchable picker for selecting groups and their subgroups. */
declare class GroupPicker {
    private container;
    private data;
    private options;
    private abortController;
    private selectedParents;
    private selectedSubs;
    private expandedGroups;
    private searchQuery;
    private searchInput;
    private listEl;
    private selectionEl;
    constructor(selector: string | HTMLElement, data: GroupData[], options?: GroupPickerOptions);
    private init;
    private render;
    private renderGroups;
    private createGroupElement;
    private renderSelection;
    private createChip;
    private toggleParentGroup;
    private toggleSubgroup;
    private toggleExpand;
    private refresh;
    private attachEvents;
    private emitChange;
    private highlightText;
    getSelection(): GroupPickerSelection;
    clearSelection(): void;
    setSelection(selection: GroupPickerSelection): void;
    expandAll(): void;
    collapseAll(): void;
    destroy(): void;
}
export { GroupPicker };
export type { GroupData, SubgroupData, GroupPickerSelection, GroupPickerOptions };
