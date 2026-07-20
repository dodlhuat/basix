type NodeType = 'file' | 'folder';
interface TreeOptions {
    onSelect?: (node: TreeNode) => void;
}
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
declare class TreeComponent {
    private container;
    private data;
    private selectedNode;
    private readonly options;
    constructor(elementOrSelector: string | HTMLElement, data: TreeNode[], options?: TreeOptions);
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
