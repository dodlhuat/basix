type NodeType = 'file' | 'folder';
/** Configuration options for a TreeComponent instance. */
interface TreeOptions {
    onSelect?: (node: TreeNode) => void;
}
/** Represents a single node in a tree structure, either a file or folder. */
declare class TreeNode {
    label: string;
    type: NodeType;
    children: TreeNode[];
    expanded: boolean;
    selected: boolean;
    element: HTMLDivElement | null;
    childrenContainer: HTMLUListElement | null;
    constructor(label: string, type?: NodeType, children?: TreeNode[]);
}
/** Renders an interactive collapsible tree view from a list of TreeNode objects. */
declare class TreeComponent {
    private container;
    private data;
    private selectedNode;
    private readonly options;
    constructor(elementOrSelector: string | HTMLElement, data: TreeNode[], options?: TreeOptions);
    private init;
    render(): void;
    private renderNode;
    private createIconElement;
    private createLabelElement;
    private createChildrenContainer;
    private toggleNode;
    private expandChildren;
    private collapseChildren;
    selectNode(node: TreeNode): void;
    expandAll(): void;
    collapseAll(): void;
    private traverseNodes;
    destroy(): void;
    getSelectedNode(): TreeNode | null;
    findNodeByLabel(label: string): TreeNode | null;
    private findNode;
}
export { TreeComponent, TreeNode };
export type { NodeType, TreeOptions };
