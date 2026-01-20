import {utils} from "./utils.js";
import {Select} from "./select.js";
import {Scrollbar} from "./scrollbar.js";
import {Modal} from "./modal.js";
import {PushMenu} from "./push-menu.js";
import {Toast} from "./toast.js";
import {DatePicker} from "./datepicker.js";
import {tree} from "./tree.js";
import {Theme} from "./theme.js";
import {Table} from "./table.js";
import {FlyoutMenu} from "./flyout-menu.js";
import {Tabs} from "./tabs.js";
import {Carousel} from "./carousel.js";

utils.ready(function () {
    Scrollbar.initAll('.scroll-container');
    Theme.init();

    new Table('#demo-table', {pageSize: 5});
    const generateData = (count) => {
        const data = [];
        const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'Robert', 'Emily', 'David', 'Emma', 'James', 'Olivia'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        const roles = ['Admin', 'User', 'Editor', 'Viewer', 'Manager', 'Developer'];
        const statuses = ['Active', 'Inactive', 'Pending', 'Banned'];

        for (let i = 1; i <= count; i++) {
            data.push({
                id: i,
                name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                email: `user${i}@example.com`,
                role: roles[Math.floor(Math.random() * roles.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                lastLogin: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
            });
        }
        return data;
    };

    const horizontalTabs = new Tabs('.horizontal', {
        layout: 'horizontal'
    });

    // Initialize Vertical Tabs
    const verticalTabs = new Tabs('.vertical', {
        layout: 'vertical'
    });

    const carousel = new Carousel('#carouselIdHere', {
        loop: true
    });

    const columns = [
        {key: 'id', label: 'ID'},
        {key: 'name', label: 'Name'},
        {key: 'email', label: 'Email'},
        {key: 'role', label: 'Role'},
        {key: 'status', label: 'Status'},
        {key: 'lastLogin', label: 'Last Login'}
    ];

    const tableData = generateData(50);
    new Table('#demo-table-js', {
        data: tableData,
        columns: columns,
        pageSize: 10
    });

    new Select('#single-select');
    new Select('#multi-select');

    const elements = document.querySelectorAll('.show-modal');
    if (elements !== undefined) {
        document.querySelector('.show-modal').addEventListener('click', function () {
            const buttons = '<div class="buttons">\<button class="button-light">Close</button>&nbsp;<button>Save Changes</button></div>';
            let modal = new Modal('bluffi', '<strong>blaffi</strong>', buttons, true, 'default');
            modal.show();

            console.warn('buttons have no bound listeners');
        })
    }

    document.querySelector('.show-toast').addEventListener('click', function () {
        let toast = new Toast('some content. maybe even more text in here!', 'some header', 'success', true)
        toast.show(3000);
    });

    PushMenu.init();

    // flyout menu
    const menu = new FlyoutMenu({
        direction: 'right',
        triggerSelector: '.trigger-flyout-menu',
    });

    // Demo Controls: Switch Direction
    const directionBtns = document.querySelectorAll('.flyout-controls > button');
    directionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            directionBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Update menu direction
            const direction = btn.dataset.direction;
            menu.setDirection(direction);
        });
    });
    utils.showCode();

    // Initialize Single Date Picker
    new DatePicker('#datepicker-single', {
        mode: 'single',
        onSelect: (date) => {
            console.log('Single selected:', date);
        }
    });

    // Initialize Range Date Picker
    new DatePicker('#datepicker-range', {
        mode: 'range',
        onSelect: (range) => {
            console.log('Range selected:', range);
        }
    });

    // Initialize Localized Date Picker
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
            return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        },
        onSelect: (date) => {
            console.log('Localized selected:', date);
        }
    });

    const data = [
        {
            "name": "Eins",
            "content": [
                "<span class=\"icon icon-article icon-spacer\"></span> filename.txt",
                "146kb",
                "Rev1.0",
                "2024-01-01 12.27:02"
            ],
            "children": []
        },
        {
            "name": "Zwei",
            "content": [
                "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
            ],
            "children": [
                {
                    "name": "Zwei.Eins",
                    "content": [],
                    "children": []
                },
                {
                    "name": "Zwei.Zwei",
                    "content": [],
                    "children": [
                        {
                            "name": "Zwei.Zwei.Null",
                            "content": [],
                            "children": []
                        },
                        {
                            "name": "Zwei.Zwei.Eins",
                            "content": [],
                            "children": []
                        },
                    ]
                }
            ]
        },
        {
            "name": "Drei",
            "content": [],
            "children": []
        }
    ];
    tree.init('.built-tree', data);

});