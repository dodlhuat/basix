import { SidebarNav } from './sidebar-nav.js';
import { Scrollbar } from './scrollbar.js';

const NAV = [
    {
        label: 'Foundation',
        items: [
            { label: 'Layout & Grid',   href: 'foundation/layout.html' },
            { label: 'Typography',       href: 'foundation/typography.html' },
            { label: 'Colors & Tokens',  href: 'foundation/colors.html' },
            { label: 'Icons',            href: 'foundation/icons.html' },
        ],
    },
    {
        label: 'Forms',
        items: [
            { label: 'Inputs & Forms',   href: 'forms/inputs.html' },
            { label: 'Date Picker',      href: 'forms/datepicker.html' },
            { label: 'Range Slider',     href: 'forms/range-slider.html' },
            { label: 'File Uploader',    href: 'forms/file-uploader.html' },
        ],
    },
    {
        label: 'Navigation',
        items: [
            { label: 'Push Menu',        href: 'navigation/push-menu.html' },
            { label: 'Flyout Menu',      href: 'navigation/flyout-menu.html' },
            { label: 'Sidebar Nav',      href: 'navigation/sidebar-nav.html' },
            { label: 'Dropdown',         href: 'navigation/dropdown.html' },
            { label: 'Tabs',             href: 'navigation/tabs.html' },
            { label: 'Breadcrumbs',      href: 'navigation/breadcrumbs.html' },
        ],
    },
    {
        label: 'Overlays',
        items: [
            { label: 'Modal',            href: 'overlays/modal.html' },
            { label: 'Popover',          href: 'overlays/popover.html' },
            { label: 'Tooltip',          href: 'overlays/tooltip.html' },
            { label: 'Bottom Sheet',     href: 'overlays/bottom-sheet.html' },
            { label: 'Toast',            href: 'overlays/toast.html' },
            { label: 'Lightbox',         href: 'overlays/lightbox.html' },
        ],
    },
    {
        label: 'Components',
        items: [
            { label: 'Buttons & Chips',  href: 'components/buttons.html' },
            { label: 'Alerts & Badge',   href: 'components/alerts.html' },
            { label: 'Accordion',        href: 'components/accordion.html' },
            { label: 'Stepper',          href: 'components/stepper.html' },
            { label: 'Timeline',         href: 'components/timeline.html' },
            { label: 'Progress & Skeleton', href: 'components/progress.html' },
            { label: 'Data Table',       href: 'components/table.html' },
            { label: 'Tree',             href: 'components/tree.html' },
            { label: 'Carousel',         href: 'components/carousel.html' },
            { label: 'Gallery',          href: 'components/gallery.html' },
            { label: 'Scrollbar',        href: 'components/scrollbar.html' },
            { label: 'Chat Bubbles',     href: 'components/chat-bubbles.html' },
            { label: 'Calendar',         href: 'components/calendar.html' },
            { label: 'Charts',           href: 'components/charts.html' },
            { label: 'Group Picker',     href: 'components/group-picker.html' },
            { label: 'Virtual Dropdown', href: 'components/virtual-dropdown.html' },
            { label: 'Timespan Picker',  href: 'components/timespan-picker.html' },
            { label: 'Rich Text Editor', href: 'components/editor.html' },
        ],
    },
    {
        label: 'Utilities',
        items: [
            { label: 'Theme',            href: 'utilities/theme.html' },
            { label: 'Scroll',           href: 'utilities/scroll.html' },
            { label: 'Context Menu',     href: 'utilities/context-menu.html' },
        ],
    },
];

class DocsNav {
    constructor() {
        this.currentPath = window.location.pathname;
        // Compute prefix to reach docs/ root from current page.
        // docs/index.html        → prefix = ''
        // docs/overlays/foo.html → prefix = '../'
        const segs = this.currentPath.split('/').filter(Boolean);
        const docsIdx = segs.lastIndexOf('docs');
        const depth = docsIdx >= 0 ? segs.length - docsIdx - 1 : 0;
        this.prefix = depth > 1 ? '../'.repeat(depth - 1) : '';
        this.render();
        this.bindMobile();
    }

    isActive(href) {
        // href is like 'overlays/popover.html' — match against current path
        return this.currentPath.endsWith('/' + href.replace(/^[^/]+\//, '')) &&
               this.currentPath.includes('/' + href.split('/')[0] + '/');
    }

    render() {
        // Sidebar
        const sidebar = document.getElementById('docs-sidebar');
        if (!sidebar) return;

        const logoHref = this.prefix ? this.prefix + '../index.html' : '../index.html';

        sidebar.innerHTML = `
            <a class="docs-sidebar-logo" href="${logoHref}">
                Basix
                <span class="docs-logo-badge">docs</span>
            </a>
            <div class="docs-sidebar-search">
                <input type="search" placeholder="Search…" id="docs-search" autocomplete="off"/>
            </div>
            <div class="scroll-container sidebar-scroll">
                <div class="viewport">
                    <div class="content">
                        <nav class="docs-nav" aria-label="Documentation navigation">
                            <ul>${NAV.map(section => this.renderSection(section)).join('')}</ul>
                        </nav>
                    </div>
                </div>
                <div class="scrollbar">
                    <div class="track">
                        <div class="thumb"></div>
                    </div>
                </div>
            </div>
        `;

        new Scrollbar(sidebar.querySelector('.sidebar-scroll'));

        // Breadcrumb
        this.renderBreadcrumb();

        // Search
        document.getElementById('docs-search')?.addEventListener('input', e => {
            this.filter(e.target.value);
        });
    }

    renderSection(section) {
        return `
            <li class="docs-nav-section">
                <div class="docs-nav-section-label">${section.label}</div>
                <ul>
                    ${section.items.map(item => this.renderItem(item, section)).join('')}
                </ul>
            </li>`;
    }

    renderItem(item, section) {
        const active = this.isActive(item.href) ? ' is-active' : '';
        return `
            <li class="docs-nav-item">
                <a href="${this.prefix}${item.href}" class="${active}">${item.label}</a>
            </li>`;
    }

    renderBreadcrumb() {
        const bc = document.getElementById('docs-breadcrumb');
        if (!bc) return;

        let activeSection = null;
        let activeItem = null;
        for (const section of NAV) {
            for (const item of section.items) {
                if (this.isActive(item.href)) {
                    activeSection = section;
                    activeItem = item;
                    break;
                }
            }
            if (activeItem) break;
        }

        if (!activeSection || !activeItem) return;

        const rootHref = this.prefix ? this.prefix + '../index.html' : '../index.html';
        bc.innerHTML = `
            <a href="${rootHref}">Basix</a>
            <span class="sep">/</span>
            <span>${activeSection.label}</span>
            <span class="sep">/</span>
            <span class="current">${activeItem.label}</span>
        `;
    }

    filter(query) {
        const q = query.toLowerCase().trim();
        document.querySelectorAll('.docs-nav-item').forEach(item => {
            const label = item.querySelector('a')?.textContent?.toLowerCase() ?? '';
            item.style.display = (!q || label.includes(q)) ? '' : 'none';
        });
        document.querySelectorAll('.docs-nav-section').forEach(section => {
            const visible = [...section.querySelectorAll('.docs-nav-item')]
                .some(i => i.style.display !== 'none');
            section.style.display = (!q || visible) ? '' : 'none';
        });
    }

    bindMobile() {
        const layout = document.querySelector('.sidebar-layout');
        if (layout) new SidebarNav(layout, { toggleSelector: '#docs-mobile-toggle' });
    }
}

export { DocsNav, NAV };
