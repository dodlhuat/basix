class GroupPicker {
    constructor(selector, data, options = {}) {
        // State
        this.selectedParents = new Set();
        this.selectedSubs = new Map();
        this.expandedGroups = new Set();
        this.searchQuery = '';
        const el = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;
        if (!el)
            throw new Error(`GroupPicker: Element not found for "${selector}"`);
        this.container = el;
        this.data = data;
        this.abortController = new AbortController();
        this.options = {
            onSelectionChange: options.onSelectionChange ?? (() => { }),
            searchPlaceholder: options.searchPlaceholder ?? 'Gruppen durchsuchen...',
            selectAllLabel: options.selectAllLabel ?? 'Alle',
            deselectLabel: options.deselectLabel ?? 'Abwählen',
            emptyLabel: options.emptyLabel ?? 'Keine Ergebnisse',
            selectionPlaceholder: options.selectionPlaceholder ?? 'Noch keine Auswahl getroffen',
        };
        this.init();
    }
    init() {
        this.container.classList.add('group-picker');
        this.render();
        this.attachEvents();
    }
    render() {
        this.container.innerHTML = '';
        // Selection summary — Basix .chips container
        this.selectionEl = document.createElement('div');
        this.selectionEl.className = 'chips group-picker__selection';
        this.selectionEl.dataset.placeholder = this.options.selectionPlaceholder;
        // Search — Basix form input with font icon overlay
        const searchWrap = document.createElement('div');
        searchWrap.className = 'group-picker__search';
        searchWrap.innerHTML = `
      <span class="icon icon-search group-picker__search-icon" aria-hidden="true"></span>
      <input type="text" placeholder="${this.options.searchPlaceholder}" />
    `;
        this.searchInput = searchWrap.querySelector('input');
        // List
        this.listEl = document.createElement('div');
        this.listEl.className = 'group-picker__list';
        this.container.append(this.selectionEl, searchWrap, this.listEl);
        this.renderGroups();
        this.renderSelection();
    }
    renderGroups() {
        this.listEl.innerHTML = '';
        const query = this.searchQuery.toLowerCase().trim();
        let visibleCount = 0;
        for (const group of this.data) {
            const subs = group.subgroups ?? [];
            const groupMatches = group.label.toLowerCase().includes(query);
            const matchingSubs = subs.filter(s => s.label.toLowerCase().includes(query));
            if (!groupMatches && matchingSubs.length === 0 && query)
                continue;
            visibleCount++;
            const groupEl = this.createGroupElement(group, query, groupMatches, matchingSubs);
            this.listEl.appendChild(groupEl);
        }
        if (visibleCount === 0) {
            const empty = document.createElement('div');
            empty.className = 'group-picker__empty';
            empty.innerHTML = `
        <span class="icon icon-search" aria-hidden="true"></span>
        <span>${this.options.emptyLabel}</span>
      `;
            this.listEl.appendChild(empty);
        }
    }
    createGroupElement(group, query, groupMatches, matchingSubs) {
        const subs = group.subgroups ?? [];
        const hasChildren = subs.length > 0;
        const el = document.createElement('div');
        el.className = 'group-picker__group';
        el.dataset.groupId = group.id;
        if (!hasChildren)
            el.classList.add('is-leaf');
        const isExpanded = hasChildren && (this.expandedGroups.has(group.id) ||
            (query.length > 0 && matchingSubs.length > 0));
        const isParentSelected = this.selectedParents.has(group.id);
        if (isExpanded)
            el.classList.add('is-expanded');
        if (isParentSelected)
            el.classList.add('is-selected');
        // Header row
        const header = document.createElement('div');
        header.className = 'group-picker__group-header';
        const label = document.createElement('span');
        label.className = 'group-picker__group-label';
        label.innerHTML = query && groupMatches
            ? this.highlightText(group.label, query)
            : group.label;
        if (hasChildren) {
            // Chevron — Basix font icon
            const chevron = document.createElement('span');
            chevron.className = 'icon icon-navigate_next group-picker__chevron';
            chevron.setAttribute('aria-hidden', 'true');
            // Count — Basix badge
            const count = document.createElement('span');
            count.className = 'badge badge-sm';
            count.textContent = `${subs.length}`;
            // Action button — Basix button, button-primary when selected
            const actionBtn = document.createElement('button');
            actionBtn.className = 'group-picker__group-action';
            if (isParentSelected) {
                actionBtn.classList.add('button-primary');
                actionBtn.textContent = this.options.deselectLabel;
            }
            else {
                actionBtn.textContent = this.options.selectAllLabel;
            }
            actionBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleParentGroup(group.id);
            }, { signal: this.abortController.signal });
            header.append(chevron, label, count, actionBtn);
            header.addEventListener('click', () => {
                this.toggleExpand(group.id);
            }, { signal: this.abortController.signal });
            // Subgroups — Basix .chips container
            const subsContainer = document.createElement('div');
            subsContainer.className = 'group-picker__subgroups';
            const subsList = document.createElement('div');
            subsList.className = 'chips group-picker__subgroup-list';
            const displaySubs = query && !groupMatches ? matchingSubs : subs;
            for (const sub of displaySubs) {
                // Subgroup chip — Basix .chip.clickable
                const subEl = document.createElement('span');
                subEl.className = 'chip clickable group-picker__subgroup';
                subEl.dataset.subId = sub.id;
                subEl.innerHTML = query ? this.highlightText(sub.label, query) : sub.label;
                const isSubSelected = this.selectedSubs.get(group.id)?.has(sub.id) ?? false;
                if (isSubSelected)
                    subEl.classList.add('is-selected');
                if (isParentSelected)
                    subEl.classList.add('is-disabled');
                subEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!isParentSelected) {
                        this.toggleSubgroup(group.id, sub.id);
                    }
                }, { signal: this.abortController.signal });
                subsList.appendChild(subEl);
            }
            subsContainer.appendChild(subsList);
            el.append(header, subsContainer);
            if (isExpanded) {
                requestAnimationFrame(() => {
                    subsContainer.style.height = subsContainer.scrollHeight + 'px';
                    subsContainer.addEventListener('transitionend', () => {
                        subsContainer.style.height = 'auto';
                    }, { once: true });
                });
            }
        }
        else {
            // Leaf group — Basix font icon check mark
            const checkEl = document.createElement('span');
            checkEl.className = 'icon icon-check group-picker__leaf-check';
            checkEl.setAttribute('aria-hidden', 'true');
            header.append(label, checkEl);
            header.addEventListener('click', () => {
                this.toggleParentGroup(group.id);
            }, { signal: this.abortController.signal });
            el.appendChild(header);
        }
        return el;
    }
    renderSelection() {
        this.selectionEl.innerHTML = '';
        for (const groupId of this.selectedParents) {
            const group = this.data.find(g => g.id === groupId);
            if (!group)
                continue;
            this.selectionEl.appendChild(this.createChip(group.label, true, () => this.toggleParentGroup(groupId)));
        }
        for (const [groupId, subs] of this.selectedSubs) {
            const group = this.data.find(g => g.id === groupId);
            if (!group)
                continue;
            for (const subId of subs) {
                const sub = group.subgroups?.find(s => s.id === subId);
                if (!sub)
                    continue;
                this.selectionEl.appendChild(this.createChip(sub.label, false, () => this.toggleSubgroup(groupId, subId)));
            }
        }
    }
    // Basix .chip.closeable structure
    createChip(label, isParent, onRemove) {
        const chip = document.createElement('span');
        chip.className = isParent
            ? 'chip closeable group-picker__chip--parent'
            : 'chip closeable';
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', `${label} entfernen`);
        btn.innerHTML = `<span class="icon icon-close"></span>`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onRemove();
        }, { signal: this.abortController.signal });
        chip.append(document.createTextNode(label), btn);
        return chip;
    }
    // State management
    toggleParentGroup(groupId) {
        if (this.selectedParents.has(groupId)) {
            this.selectedParents.delete(groupId);
        }
        else {
            this.selectedParents.add(groupId);
            this.selectedSubs.delete(groupId);
        }
        this.refresh();
        this.emitChange();
    }
    toggleSubgroup(groupId, subId) {
        if (!this.selectedSubs.has(groupId)) {
            this.selectedSubs.set(groupId, new Set());
        }
        const subs = this.selectedSubs.get(groupId);
        if (subs.has(subId)) {
            subs.delete(subId);
            if (subs.size === 0)
                this.selectedSubs.delete(groupId);
        }
        else {
            subs.add(subId);
        }
        const group = this.data.find(g => g.id === groupId);
        if (group && subs.size === (group.subgroups ?? []).length) {
            this.selectedSubs.delete(groupId);
            this.selectedParents.add(groupId);
        }
        this.refresh();
        this.emitChange();
    }
    toggleExpand(groupId) {
        const groupEl = this.listEl.querySelector(`[data-group-id="${groupId}"]`);
        const subsEl = groupEl?.querySelector('.group-picker__subgroups');
        if (this.expandedGroups.has(groupId)) {
            this.expandedGroups.delete(groupId);
            groupEl?.classList.remove('is-expanded');
            if (subsEl) {
                subsEl.style.height = subsEl.scrollHeight + 'px';
                requestAnimationFrame(() => {
                    subsEl.style.height = '0';
                });
            }
        }
        else {
            this.expandedGroups.add(groupId);
            groupEl?.classList.add('is-expanded');
            if (subsEl) {
                subsEl.style.height = subsEl.scrollHeight + 'px';
                subsEl.addEventListener('transitionend', () => {
                    if (this.expandedGroups.has(groupId)) {
                        subsEl.style.height = 'auto';
                    }
                }, { once: true });
            }
        }
    }
    refresh() {
        this.renderGroups();
        this.renderSelection();
    }
    attachEvents() {
        let debounceTimer;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.searchQuery = this.searchInput.value;
                this.renderGroups();
            }, 120);
        }, { signal: this.abortController.signal });
    }
    emitChange() {
        const selection = this.getSelection();
        this.options.onSelectionChange(selection);
        this.container.dispatchEvent(new CustomEvent('group-picker-change', {
            detail: selection,
            bubbles: true,
        }));
    }
    highlightText(text, query) {
        if (!query)
            return text;
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    // Public API
    getSelection() {
        const parentGroups = [...this.selectedParents];
        const subgroups = [];
        for (const [groupId, subs] of this.selectedSubs) {
            for (const subId of subs) {
                subgroups.push({ groupId, subgroupId: subId });
            }
        }
        return { parentGroups, subgroups };
    }
    clearSelection() {
        this.selectedParents.clear();
        this.selectedSubs.clear();
        this.refresh();
        this.emitChange();
    }
    setSelection(selection) {
        this.selectedParents = new Set(selection.parentGroups);
        this.selectedSubs.clear();
        for (const { groupId, subgroupId } of selection.subgroups) {
            if (!this.selectedSubs.has(groupId)) {
                this.selectedSubs.set(groupId, new Set());
            }
            this.selectedSubs.get(groupId).add(subgroupId);
        }
        this.refresh();
        this.emitChange();
    }
    expandAll() {
        this.data.forEach(g => this.expandedGroups.add(g.id));
        this.renderGroups();
    }
    collapseAll() {
        this.expandedGroups.clear();
        this.renderGroups();
    }
    destroy() {
        this.abortController.abort();
        this.container.innerHTML = '';
        this.container.classList.remove('group-picker');
    }
}
export { GroupPicker };
