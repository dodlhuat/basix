class TreeNode {
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
class TreeComponent {
    constructor(elementOrSelector, data, options = {}) {
        const container = typeof elementOrSelector === 'string'
            ? document.querySelector(elementOrSelector)
            : elementOrSelector;
        if (!container) {
            throw new Error(`TreeComponent: Element not found for selector "${elementOrSelector}"`);
        }
        this.container = container;
        this.data = data;
        this.selectedNode = null;
        this.options = options;
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
        if (node.selected)
            itemDiv.classList.add('selected');
        if (node.expanded)
            itemDiv.classList.add('expanded');
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
            childrenUl.style.height = 'auto';
        }
        node.children.forEach(child => {
            this.renderNode(child, childrenUl);
        });
        return childrenUl;
    }
    toggleNode(node) {
        node.expanded = !node.expanded;
        node.element?.classList.toggle('expanded', node.expanded);
        if (node.childrenContainer) {
            if (node.expanded) {
                this.expandChildren(node.childrenContainer);
            }
            else {
                this.collapseChildren(node.childrenContainer);
            }
            node.childrenContainer.classList.toggle('expanded', node.expanded);
        }
    }
    expandChildren(container) {
        container.style.height = container.scrollHeight + 'px';
        container.addEventListener('transitionend', () => {
            container.style.height = 'auto';
        }, { once: true });
    }
    collapseChildren(container) {
        container.style.height = container.offsetHeight + 'px';
        requestAnimationFrame(() => {
            container.style.height = '0';
        });
    }
    selectNode(node) {
        if (this.selectedNode?.element) {
            this.selectedNode.element.classList.remove('selected');
            this.selectedNode.selected = false;
        }
        node.selected = true;
        node.element?.classList.add('selected');
        this.selectedNode = node;
        this.options.onSelect?.(node);
        this.container.dispatchEvent(new CustomEvent('tree-select', {
            detail: { node },
            bubbles: true,
        }));
    }
    expandAll() {
        this.traverseNodes(this.data, (node) => {
            if (node.type === 'folder' && node.childrenContainer) {
                node.expanded = true;
                node.element?.classList.add('expanded');
                node.childrenContainer.classList.add('expanded');
                node.childrenContainer.style.height = 'auto';
            }
        });
    }
    collapseAll() {
        this.traverseNodes(this.data, (node) => {
            if (node.type === 'folder' && node.childrenContainer) {
                node.expanded = false;
                node.element?.classList.remove('expanded');
                node.childrenContainer.classList.remove('expanded');
                node.childrenContainer.style.height = '0';
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
    destroy() {
        this.container.innerHTML = '';
        this.selectedNode = null;
    }
    getSelectedNode() {
        return this.selectedNode;
    }
    findNodeByLabel(label) {
        return this.findNode(this.data, label);
    }
    findNode(nodes, label) {
        for (const node of nodes) {
            if (node.label === label)
                return node;
            if (node.children.length > 0) {
                const found = this.findNode(node.children, label);
                if (found)
                    return found;
            }
        }
        return null;
    }
}
export { TreeComponent, TreeNode };
