export class TreeNode {
    constructor(label, type = 'file', children = []) {
        this.label = label;
        this.type = type;
        this.children = children;
        this.expanded = false;
        this.selected = false;
        this.element = null;
        this.childrenContainer = null;
    }
}
export class TreeComponent {
    constructor(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Element with id "${containerId}" not found`);
        }
        this.container = container;
        this.data = data;
        this.selectedNode = null;
        this.init();
    }
    init() {
        this.render();
    }
    render() {
        this.container.innerHTML = '';
        this.data.forEach(node => {
            this.renderNode(node, this.container);
        });
    }
    renderNode(node, parentElement) {
        const li = document.createElement('li');
        li.className = 'tree-node';
        const itemDiv = document.createElement('div');
        itemDiv.className = `tree-item ${node.type}`;
        if (node.selected) {
            itemDiv.classList.add('selected');
        }
        if (node.expanded) {
            itemDiv.classList.add('expanded');
        }
        const iconDiv = this.createIconElement(node.type);
        const labelSpan = this.createLabelElement(node.label);
        itemDiv.append(iconDiv, labelSpan);
        li.appendChild(itemDiv);
        node.element = itemDiv;
        if (node.type === 'folder' && node.children.length > 0) {
            const childrenUl = this.createChildrenContainer(node);
            li.appendChild(childrenUl);
            node.childrenContainer = childrenUl;
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(node);
            });
        }
        else {
            itemDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectNode(node);
            });
        }
        parentElement.appendChild(li);
    }
    createIconElement(type) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'tree-icon';
        if (type === 'folder') {
            iconDiv.innerHTML = `
        <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
        }
        else {
            iconDiv.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M13 2v7h7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
        }
        return iconDiv;
    }
    createLabelElement(label) {
        const labelSpan = document.createElement('span');
        labelSpan.className = 'tree-label';
        labelSpan.textContent = label;
        return labelSpan;
    }
    createChildrenContainer(node) {
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'tree-children';
        if (node.expanded) {
            childrenUl.classList.add('expanded');
        }
        node.children.forEach(child => {
            this.renderNode(child, childrenUl);
        });
        return childrenUl;
    }
    toggleNode(node) {
        node.expanded = !node.expanded;
        if (node.element) {
            node.element.classList.toggle('expanded', node.expanded);
        }
        if (node.childrenContainer) {
            node.childrenContainer.classList.toggle('expanded', node.expanded);
        }
    }
    selectNode(node) {
        if (this.selectedNode?.element) {
            this.selectedNode.element.classList.remove('selected');
            this.selectedNode.selected = false;
        }
        node.selected = true;
        node.element?.classList.add('selected');
        this.selectedNode = node;
        console.log('Selected:', node.label);
    }
    expandAll() {
        this.traverseNodes(this.data, (node) => {
            if (node.type === 'folder') {
                node.expanded = true;
                node.element?.classList.add('expanded');
                node.childrenContainer?.classList.add('expanded');
            }
        });
    }
    collapseAll() {
        this.traverseNodes(this.data, (node) => {
            if (node.type === 'folder') {
                node.expanded = false;
                node.element?.classList.remove('expanded');
                node.childrenContainer?.classList.remove('expanded');
            }
        });
    }
    traverseNodes(nodes, callback) {
        nodes.forEach(node => {
            callback(node);
            if (node.children.length > 0) {
                this.traverseNodes(node.children, callback);
            }
        });
    }
    getSelectedNode() {
        return this.selectedNode;
    }
    findNodeByLabel(label) {
        let result = null;
        this.traverseNodes(this.data, (node) => {
            if (node.label === label) {
                result = node;
            }
        });
        return result;
    }
}
