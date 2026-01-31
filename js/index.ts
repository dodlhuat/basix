import { utils } from "./utils.js";
import { Select } from "./select.js";
import { Scrollbar } from "./scrollbar.js";
import { Modal } from "./modal.js";
import { PushMenu } from "./push-menu.js";
import { Toast } from "./toast.js";
import { DatePicker } from "./datepicker.js";
import { Theme } from "./theme.js";
import { Table, TableColumn, TableRow } from "./table.js";
import { FlyoutMenu } from "./flyout-menu.js";
import { Tabs } from "./tabs.js";
import { Carousel } from "./carousel.js";
import { CodeViewer } from "./code-viewer.js";
import { FileUploader } from "./file-uploader.js";
import { TreeComponent, TreeNode } from "./tree.js";

// Generate sample table data
const generateData = (count: number): TableRow[] => {
    const data: TableRow[] = [];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'Robert', 'Emily', 'David', 'Emma', 'James', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const roles = ['Admin', 'User', 'Editor', 'Viewer', 'Manager', 'Developer'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Banned'];

    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const role = roles[Math.floor(Math.random() * roles.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const lastLoginDate = new Date(Date.now() - Math.floor(Math.random() * 10000000000));

        data.push({
            id: i,
            name: `${firstName} ${lastName}`,
            email: `user${i}@example.com`,
            role,
            status,
            lastLogin: lastLoginDate.toLocaleDateString()
        });
    }
    
    return data;
};

// Initialize all components when DOM is ready
utils.ready(() => {
    // Initialize scrollbars
    Scrollbar.initAll('.scroll-container');
    
    // Initialize theme
    Theme.init();

    // Initialize basic table
    new Table('#demo-table', { pageSize: 5 });

    // Initialize horizontal tabs
    const horizontalTabs = new Tabs('.horizontal', {
        layout: 'horizontal'
    });

    // Initialize vertical tabs
    const verticalTabs = new Tabs('.vertical', {
        layout: 'vertical'
    });

    // Initialize carousel
    const carousel = new Carousel('#carouselIdHere', {
        loop: true
    });

    // Initialize advanced table with data
    const columns: TableColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'lastLogin', label: 'Last Login' }
    ];

    const tableData = generateData(50);
    new Table('#demo-table-js', {
        data: tableData,
        columns: columns,
        pageSize: 10
    });

    // Initialize select components
    new Select('#single-select');
    new Select('#multi-select');

    // Initialize modal
    const modalTrigger = document.querySelector('.show-modal');
    if (modalTrigger) {
        modalTrigger.addEventListener('click', () => {
            const buttons = '<div class="buttons"><button class="button-light">Close</button>&nbsp;<button>Save Changes</button></div>';
            const modal = new Modal('bluffi', '<strong>blaffi</strong>', buttons, true, 'default');
            modal.show();

            console.warn('Buttons have no bound listeners');
        });
    }

    // Initialize toast
    const toastTrigger = document.querySelector('.show-toast');
    if (toastTrigger) {
        toastTrigger.addEventListener('click', () => {
            const toast = new Toast(
                'some content. maybe even more text in here!',
                'some header',
                'success',
                true
            );
            toast.show(3000);
        });
    }

    // Initialize push menu
    PushMenu.init();

    // Initialize flyout menu
    const menu = new FlyoutMenu({
        direction: 'right',
        triggerSelector: '.trigger-flyout-menu',
    });

    // Flyout menu controls: Switch direction
    const directionBtns = document.querySelectorAll<HTMLButtonElement>('.flyout-controls > button');
    directionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            directionBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            btn.classList.add('active');

            // Update menu direction
            const direction = btn.dataset.direction as 'left' | 'right' | undefined;
            if (direction) {
                menu.setDirection(direction);
            }
        });
    });

    // Initialize single date picker
    new DatePicker('#datepicker-single', {
        mode: 'single',
        onSelect: (date) => {
            console.log('Single selected:', date);
        }
    });

    // Initialize range date picker
    new DatePicker('#datepicker-range', {
        mode: 'range',
        onSelect: (range) => {
            console.log('Range selected:', range);
        }
    });

    // Initialize localized date picker
    new DatePicker('#datepicker-localized', {
        mode: 'single',
        startDay: 1, // Monday
        locales: {
            days: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
            months: [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ]
        },
        format: (date) => {
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },
        onSelect: (date) => {
            console.log('Localized selected:', date);
        }
    });

    // Initialize code viewer with usage example
    const usageTabs = `new Tabs('.horizontal', {
    layout: 'horizontal',
    defaultTab: 0
});`;
    
    new CodeViewer('#usage-tabs', usageTabs, 'js');

    // Initialize file uploader
    const uploaderElement = document.querySelector<HTMLElement>('.uploader-content');
    if (uploaderElement) {
        new FileUploader(uploaderElement);
    }

    const sampleData: TreeNode[] = [
    new TreeNode('Documents', 'folder', [
        new TreeNode('Work', 'folder', [
            new TreeNode('presentation.pptx', 'file'),
            new TreeNode('report.docx', 'file'),
            new TreeNode('budget.xlsx', 'file')
        ]),
        new TreeNode('Personal', 'folder', [
            new TreeNode('resume.pdf', 'file'),
            new TreeNode('vacation-photos', 'folder', [
                new TreeNode('beach.jpg', 'file'),
                new TreeNode('mountain.jpg', 'file')
            ])
        ])
        ]),
        new TreeNode('Projects', 'folder', [
            new TreeNode('website', 'folder', [
                new TreeNode('index.html', 'file'),
                new TreeNode('styles.css', 'file'),
                new TreeNode('script.js', 'file')
            ]),
            new TreeNode('app', 'folder', [
                new TreeNode('src', 'folder', [
                    new TreeNode('main.js', 'file'),
                    new TreeNode('utils.js', 'file')
                ]),
                new TreeNode('package.json', 'file')
            ])
        ]),
        new TreeNode('Downloads', 'folder', [
            new TreeNode('installer.exe', 'file'),
            new TreeNode('readme.txt', 'file')
        ]),
        new TreeNode('README.md', 'file')
    ];
    const tree = new TreeComponent('#tree-root', sampleData);
});