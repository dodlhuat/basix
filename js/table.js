class Table {
    constructor(table, opts = {}) {
        if (!(table instanceof HTMLTableElement)) throw new Error('TableEnhancer: pass an HTMLTableElement')
        this.table = table
        this.thead = table.tHead
        this.tbody = table.tBodies[0]
        // read original row data as array of cell texts
        this._origRows = Array.from(this.tbody.rows).map(r => Array.from(r.cells).map(td => td.textContent.trim()))

        // options
        this.opts = Object.assign({
            pageSize: 5,
            pageSizeOptions: [5, 10, 20, 50],
            searchable: true,
            debounceMs: 220,
            container: table.parentElement
        }, opts)

        this.state = {
            query: '',
            pageSize: this.opts.pageSize,
            page: 1,
            filteredIdx: this._origRows.map((_, i) => i),
            sort: {col: null, dir: null} // dir: 'asc' | 'desc' | null
        }

        this._renderControls()
        this._setupSortableHeaders()
        this._apply()
    }

    _renderControls() {
        const root = document.createElement('div')
        root.className = 'table-controls'

        // Search
        if (this.opts.searchable) {
            const input = document.createElement('input')
            input.placeholder = 'Search...'
            input.className = 'input search'
            this._debounced((e) => {
                this.state.query = e.target.value;
                this.state.page = 1;
                this._apply()
            }, this.opts.debounceMs, input)
            this.searchInput = input
            root.appendChild(input)
        }

        const right = document.createElement('div')
        right.className = 'controls-right'

        const sizeSelect = document.createElement('select')
        this.opts.pageSizeOptions.forEach(n => {
            const o = document.createElement('option');
            o.value = n;
            o.textContent = `${n} / page`;
            sizeSelect.appendChild(o)
        })
        sizeSelect.value = this.state.pageSize
        sizeSelect.className = 'input'
        sizeSelect.addEventListener('change', e => {
            this.state.pageSize = Number(e.target.value);
            this.state.page = 1;
            this._apply()
        })
        this.sizeSelect = sizeSelect

        const pagination = document.createElement('div')
        pagination.className = 'pagination'
        this.pagination = pagination

        right.appendChild(sizeSelect)
        right.appendChild(pagination)

        root.appendChild(right)
        this.opts.container.insertBefore(root, this.table)
    }

    _debounced(fn, ms, el) {
        // helper to attach debounced input handler
        let t
        el.addEventListener('input', (e) => {
            clearTimeout(t)
            const ev = e
            t = setTimeout(() => fn(ev), ms)
        })
    }

    _setupSortableHeaders() {
        // wrap headers with buttons and add click handlers for sorting
        const headers = Array.from(this.thead.rows[0].cells)
        headers.forEach((th, colIdx) => {
            // create button
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.className = 'th-btn'
            btn.setAttribute('data-col', colIdx)

            // preserve header text
            const span = document.createElement('span')
            span.textContent = th.textContent.trim()

            // svg icon (neutral)
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.setAttribute('viewBox', '0 0 24 24')
            svg.classList.add('sort-icon')
            svg.innerHTML = '<path d="M7 14l5-5 5 5H7zM7 10l5 5 5-5H7z" fill="currentColor" opacity="0.25"/>'

            btn.appendChild(span)
            btn.appendChild(svg)

            // clear th and append button
            th.textContent = ''
            th.appendChild(btn)

            btn.addEventListener('click', () => {
                // cycle: null -> asc -> desc -> null
                const current = this.state.sort
                if (current.col !== colIdx) this.state.sort = {col: colIdx, dir: 'asc'}
                else if (current.dir === 'asc') this.state.sort.dir = 'desc'
                else this.state.sort = {col: null, dir: null}
                this.state.page = 1
                this._apply()
                this._updateHeaderIcons()
            })
        })
    }

    _updateHeaderIcons() {
        const headers = Array.from(this.thead.rows[0].cells)
        headers.forEach((th, i) => {
            const btn = th.querySelector('.th-btn')
            const icon = btn.querySelector('.sort-icon')
            const path = icon.querySelector('path')
            if (this.state.sort.col === i) {
                if (this.state.sort.dir === 'asc') {
                    path.setAttribute('d', 'M12 5l6 6H6l6-6z')
                    icon.style.opacity = '1'
                    btn.classList.add('sort-active')
                } else if (this.state.sort.dir === 'desc') {
                    path.setAttribute('d', 'M12 19l-6-6h12l-6 6z')
                    icon.style.opacity = '1'
                    btn.classList.add('sort-active')
                }
            } else {
                // neutral
                path.setAttribute('d', 'M7 14l5-5 5 5H7zM7 10l5 5 5-5H7z')
                icon.style.opacity = '0.25'
                btn.classList.remove('sort-active')
            }
        })
    }

    _apply() {
        // 1) filter based on query (global across all columns)
        const q = this.state.query.trim().toLowerCase()
        if (!q) {
            this.state.filteredIdx = this._origRows.map((_, i) => i)
        } else {
            this.state.filteredIdx = this._origRows
                .map((cells, i) => ({cells, i}))
                .filter(o => o.cells.join('\u0000').toLowerCase().includes(q))
                .map(o => o.i)
        }

        // 2) sort the filtered indices if a sort is active (applies to filtered rows only)
        if (this.state.sort.col !== null && this.state.sort.dir) {
            const col = this.state.sort.col
            const dir = this.state.sort.dir
            this.state.filteredIdx.sort((a, b) => {
                const va = (this._origRows[a][col] || '').toLowerCase()
                const vb = (this._origRows[b][col] || '').toLowerCase()
                if (va === vb) return 0
                if (va < vb) return dir === 'asc' ? -1 : 1
                return dir === 'asc' ? 1 : -1
            })
        }

        // pagination
        const totalItems = this.state.filteredIdx.length
        const pageSize = Math.max(1, Number(this.state.pageSize) || 1)
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
        this.state.page = Math.min(Math.max(1, this.state.page), totalPages)

        // render body and pagination
        this._renderBody()
        this._renderPagination(totalPages)
        this._updateHeaderIcons()
    }

    _renderBody() {
        const start = (this.state.page - 1) * this.state.pageSize
        const end = start + this.state.pageSize
        const slice = this.state.filteredIdx.slice(start, end)

        this.tbody.innerHTML = ''

        for (const idx of slice) {
            const tr = document.createElement('tr')
            for (const text of this._origRows[idx]) {
                const td = document.createElement('td')
                td.innerHTML = this._highlight(text, this.state.query)
                tr.appendChild(td)
            }
            this.tbody.appendChild(tr)
        }

        if (slice.length === 0) {
            const tr = document.createElement('tr')
            const td = document.createElement('td')
            td.colSpan = (this.thead ? this.thead.rows[0].cells.length : 1)
            td.className = 'muted'
            td.textContent = 'No results found.'
            tr.appendChild(td)
            this.tbody.appendChild(tr)
        }
    }

    _highlight(text, q) {
        if (!q) return this._escapeHtml(text)
        // simple case-insensitive highlight
        const esc = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')
        const re = new RegExp('(' + esc + ')', 'ig')
        return this._escapeHtml(text).replace(re, '<mark class="match">$1</mark>')
    }

    _escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": "&#39;"
        })[s])
    }

    _renderPagination(totalPages) {
        this.pagination.innerHTML = ''
        const createBtn = (label, disabled, props = {}) => {
            const b = document.createElement('button')
            b.type = 'button'
            b.className = 'page-btn'
            b.textContent = label
            if (disabled) b.disabled = true
            Object.entries(props).forEach(([k, v]) => b.setAttribute(k, v))
            return b
        }

        const prev = createBtn('Prev', this.state.page <= 1)
        prev.addEventListener('click', () => {
            if (this.state.page > 1) {
                this.state.page--;
                this._apply()
            }
        })
        this.pagination.appendChild(prev)

        const addPage = (p) => {
            const btn = createBtn(String(p), false, {'aria-current': this.state.page === p ? 'true' : 'false'})
            btn.addEventListener('click', () => {
                this.state.page = p;
                this._apply()
            })
            this.pagination.appendChild(btn)
        }

        const range = this._pageRange(totalPages, this.state.page, 2)
        for (const r of range) {
            if (r === '...') {
                const span = document.createElement('span');
                span.className = 'muted';
                span.textContent = '...';
                this.pagination.appendChild(span)
            } else addPage(r)
        }

        const next = createBtn('Next', this.state.page >= totalPages)
        next.addEventListener('click', () => {
            if (this.state.page < totalPages) {
                this.state.page++;
                this._apply()
            }
        })
        this.pagination.appendChild(next)

        const info = document.createElement('div')
        info.className = 'muted'
        info.style.marginLeft = '8px'
        const startItem = (this.state.filteredIdx.length === 0) ? 0 : ((this.state.page - 1) * this.state.pageSize + 1)
        const endItem = Math.min(this.state.filteredIdx.length, this.state.page * this.state.pageSize)
        info.textContent = `${startItem}-${endItem} of ${this.state.filteredIdx.length}`
        this.pagination.appendChild(info)
    }

    _pageRange(total, current, delta = 2) {
        const left = Math.max(1, current - delta)
        const right = Math.min(total, current + delta)
        const range = []
        if (left > 1) {
            range.push(1);
            if (left > 2) range.push('...')
        }
        for (let i = left; i <= right; i++) range.push(i)
        if (right < total) {
            if (right < total - 1) range.push('...');
            range.push(total)
        }
        return range
    }

    refresh() {
        this._origRows = Array.from(this.tbody.rows).map(r => Array.from(r.cells).map(td => td.textContent.trim()))
        this.state.page = 1
        this._apply()
    }

    static initAll() {
        document.querySelectorAll('table[data-enhance]').forEach(t => new Table(t, {pageSize: 5}))
    }
}

export {Table}